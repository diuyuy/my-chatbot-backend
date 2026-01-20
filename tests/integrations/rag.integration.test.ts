import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  documentChunks,
  documentResources,
  users,
} from "../../src/common/db/schema/schema";
import app from "../../src/index";
import { db } from "../setup";

// Mock the AI service functions
vi.mock("../../src/features/ai/ai.service", () => ({
  generateEmbeddings: vi.fn(async (content: string) => {
    // Return mock embeddings data
    const chunks =
      content.length > 100
        ? [content.slice(0, 100), content.slice(100)]
        : [content];
    return chunks.map((chunk) => ({
      content: chunk,
      embedding: Array(1536).fill(0.1), // Mock 1536-dimensional vector
    }));
  }),
  generateEmbedding: vi.fn(async (content: string) => {
    // Return mock embedding vector
    return Array(1536).fill(0.1);
  }),
}));

describe("RAG Integration Tests", () => {
  let testUserId: number;
  let testApiKey: string;
  let anotherUserId: number;
  let anotherApiKey: string;

  beforeEach(async () => {
    // Create test users
    const [user1] = await db
      .insert(users)
      .values({ apiKey: "test-api-key-1" })
      .returning();
    testUserId = user1!.id;
    testApiKey = user1!.apiKey;

    const [user2] = await db
      .insert(users)
      .values({ apiKey: "test-api-key-2" })
      .returning();
    anotherUserId = user2!.id;
    anotherApiKey = user2!.apiKey;
  });

  describe("POST /api/rags", () => {
    it("should create embeddings for text content", async () => {
      const res = await app.request("/api/rags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          content: "This is a test content for embedding generation.",
          resourceName: "test.txt",
        }),
      });

      expect(res.status).toBe(201);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify resource was created
      const resources = await db
        .select()
        .from(documentResources)
        .where(sql`${documentResources.userId} = ${testUserId}`);

      expect(resources).toHaveLength(1);
      expect(resources[0]!.name).toBe("test.txt");
      expect(resources[0]!.fileType).toBe("txt");

      // Verify chunks were created
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(sql`${documentChunks.userId} = ${testUserId}`);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]!.content).toBe(
        "This is a test content for embedding generation.",
      );
    });

    it("should create embeddings without resource name", async () => {
      const res = await app.request("/api/rags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          content: "Test content without name",
        }),
      });

      expect(res.status).toBe(201);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify resource was created with truncated content as name
      const resources = await db
        .select()
        .from(documentResources)
        .where(sql`${documentResources.userId} = ${testUserId}`);

      expect(resources).toHaveLength(1);
      expect(resources[0]!.name).toBe("Test content without name");
    });

    it("should handle markdown file type", async () => {
      const res = await app.request("/api/rags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          content: "# Markdown Content\n\nThis is markdown.",
          resourceName: "test.md",
          docsLanguage: "markdown",
        }),
      });

      expect(res.status).toBe(201);

      const resources = await db
        .select()
        .from(documentResources)
        .where(sql`${documentResources.userId} = ${testUserId}`);

      expect(resources[0]!.fileType).toBe("md");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request("/api/rags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Test content",
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request("/api/rags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          // Missing content field
          resourceName: "test.txt",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/rags/resources", () => {
    beforeEach(async () => {
      // Create test resources
      await db.insert(documentResources).values([
        {
          userId: testUserId,
          name: "Resource 1",
          fileType: "txt",
        },
        {
          userId: testUserId,
          name: "Resource 2",
          fileType: "md",
        },
        {
          userId: testUserId,
          name: "Another Resource",
          fileType: "pdf",
        },
        {
          userId: anotherUserId,
          name: "Other User Resource",
          fileType: "txt",
        },
      ]);
    });

    it("should return paginated resources for authenticated user", async () => {
      const res = await app.request("/api/rags/resources?limit=10", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(3);
      expect(body.data.totalElements).toBe(3);
    });

    it("should filter resources by name", async () => {
      const res = await app.request(
        "/api/rags/resources?limit=10&filter=Resource",
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(3);
    });

    it("should respect pagination limit", async () => {
      const res = await app.request("/api/rags/resources?limit=2", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.data.items).toHaveLength(2);
      expect(body.data.hasNext).toBe(true);
      expect(body.data.nextCursor).toBeDefined();
    });

    it("should support cursor-based pagination", async () => {
      // Get first page
      const firstRes = await app.request("/api/rags/resources?limit=2", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      const firstBody = (await firstRes.json()) as any;
      console.log("🚀 ~ firstBody:", JSON.stringify(firstBody, null, 2));
      const cursor = firstBody.data.nextCursor;
      console.log("🚀 ~ cursor:", cursor);

      // Get second page
      const secondRes = await app.request(
        `/api/rags/resources?limit=2&cursor=${cursor}`,
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(secondRes.status).toBe(200);

      const secondBody = (await secondRes.json()) as any;
      console.log("🚀 ~ secondBody:", JSON.stringify(secondBody, null, 2));
      expect(secondBody.data.items).toHaveLength(1);
      expect(secondBody.data.hasNext).toBe(false);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request("/api/rags/resources?limit=10");

      expect(res.status).toBe(401);
    });

    it("should return 400 for missing limit parameter", async () => {
      const res = await app.request("/api/rags/resources", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/rags/resources/:resourceId", () => {
    let testResourceId: number;
    let anotherResourceId: number;

    beforeEach(async () => {
      // Create test resources
      const [resource1] = await db
        .insert(documentResources)
        .values({
          userId: testUserId,
          name: "Test Resource",
          fileType: "txt",
        })
        .returning();
      testResourceId = resource1!.id;

      const [resource2] = await db
        .insert(documentResources)
        .values({
          userId: anotherUserId,
          name: "Other User Resource",
          fileType: "txt",
        })
        .returning();
      anotherResourceId = resource2!.id;

      // Create test chunks for testResource
      await db.insert(documentChunks).values([
        {
          userId: testUserId,
          resourceId: testResourceId,
          content: "Chunk 1 content",
          embedding: sql`array_fill(0.1, ARRAY[1536])::vector`,
        },
        {
          userId: testUserId,
          resourceId: testResourceId,
          content: "Chunk 2 content",
          embedding: sql`array_fill(0.2, ARRAY[1536])::vector`,
        },
      ]);
    });

    it("should return resource with chunks", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testResourceId);
      expect(body.data.name).toBe("Test Resource");
      expect(body.data.embeddings).toHaveLength(2);
      expect(body.data.embeddings[0].content).toBe("Chunk 1 content");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`);

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to access another user's resource", async () => {
      const res = await app.request(
        `/api/rags/resources/${anotherResourceId}`,
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent resource", async () => {
      const res = await app.request("/api/rags/resources/99999", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/rags/resources/:resourceId", () => {
    let testResourceId: number;
    let anotherResourceId: number;

    beforeEach(async () => {
      // Create test resources
      const [resource1] = await db
        .insert(documentResources)
        .values({
          userId: testUserId,
          name: "Original Name",
          fileType: "txt",
        })
        .returning();
      testResourceId = resource1!.id;

      const [resource2] = await db
        .insert(documentResources)
        .values({
          userId: anotherUserId,
          name: "Other User Resource",
          fileType: "txt",
        })
        .returning();
      anotherResourceId = resource2!.id;
    });

    it("should update resource name", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify resource was updated
      const [resource] = await db
        .select()
        .from(documentResources)
        .where(sql`${documentResources.id} = ${testResourceId}`);

      expect(resource!.name).toBe("Updated Name");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to update another user's resource", async () => {
      const res = await app.request(
        `/api/rags/resources/${anotherResourceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            name: "Updated Name",
          }),
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          name: "", // Empty name
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/rags/resources/:resourceId", () => {
    let testResourceId: number;
    let anotherResourceId: number;

    beforeEach(async () => {
      // Create test resources
      const [resource1] = await db
        .insert(documentResources)
        .values({
          userId: testUserId,
          name: "Resource to Delete",
          fileType: "txt",
        })
        .returning();
      testResourceId = resource1!.id;

      const [resource2] = await db
        .insert(documentResources)
        .values({
          userId: anotherUserId,
          name: "Other User Resource",
          fileType: "txt",
        })
        .returning();
      anotherResourceId = resource2!.id;

      // Create test chunks for testResource
      await db.insert(documentChunks).values([
        {
          userId: testUserId,
          resourceId: testResourceId,
          content: "Chunk 1",
          embedding: sql`array_fill(0.1, ARRAY[1536])::vector`,
        },
      ]);
    });

    it("should delete resource and its chunks", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify resource was deleted
      const resources = await db
        .select()
        .from(documentResources)
        .where(sql`${documentResources.id} = ${testResourceId}`);

      expect(resources).toHaveLength(0);

      // Verify chunks were deleted (cascade)
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(sql`${documentChunks.resourceId} = ${testResourceId}`);

      expect(chunks).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(`/api/rags/resources/${testResourceId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to delete another user's resource", async () => {
      const res = await app.request(
        `/api/rags/resources/${anotherResourceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent resource", async () => {
      const res = await app.request("/api/rags/resources/99999", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/rags/chunks/:chunkId", () => {
    let testChunkId: number;
    let anotherChunkId: number;
    let testResourceId: number;

    beforeEach(async () => {
      // Create test resources
      const [resource1] = await db
        .insert(documentResources)
        .values({
          userId: testUserId,
          name: "Test Resource",
          fileType: "txt",
        })
        .returning();
      testResourceId = resource1!.id;

      const [resource2] = await db
        .insert(documentResources)
        .values({
          userId: anotherUserId,
          name: "Other User Resource",
          fileType: "txt",
        })
        .returning();

      // Create test chunks
      const [chunk1] = await db
        .insert(documentChunks)
        .values({
          userId: testUserId,
          resourceId: testResourceId,
          content: "Chunk to delete",
          embedding: sql`array_fill(0.1, ARRAY[1536])::vector`,
        })
        .returning();
      testChunkId = chunk1!.id;

      const [chunk2] = await db
        .insert(documentChunks)
        .values({
          userId: anotherUserId,
          resourceId: resource2!.id,
          content: "Other user chunk",
          embedding: sql`array_fill(0.2, ARRAY[1536])::vector`,
        })
        .returning();
      anotherChunkId = chunk2!.id;
    });

    it("should delete chunk", async () => {
      const res = await app.request(`/api/rags/chunks/${testChunkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify chunk was deleted
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(sql`${documentChunks.id} = ${testChunkId}`);

      expect(chunks).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(`/api/rags/chunks/${testChunkId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to delete another user's chunk", async () => {
      const res = await app.request(`/api/rags/chunks/${anotherChunkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent chunk", async () => {
      const res = await app.request("/api/rags/chunks/99999", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });
});
