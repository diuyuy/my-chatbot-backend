import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  conversations,
  favoriteConversations,
  messages,
  users,
} from "../../src/common/db/schema/schema";
import app from "../../src/index";
import { db } from "../setup";

// Mock the generateAIResponse function
vi.mock(
  "../../src/features/conversation/services/generate-ai-response",
  () => ({
    generateAIResponse: vi.fn(async () => {
      // Return a mock streaming response
      return new Response("mock streaming response", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }),
  }),
);

describe("Conversation Integration Tests", () => {
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

  describe("POST /api/conversations/new", () => {
    it("should create a new conversation", async () => {
      const res = await app.request("/api/conversations/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          message: "Hello, this is my first message",
        }),
      });

      expect(res.status).toBe(201);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("conversationId");

      // Verify conversation was created
      const createdConversations = await db
        .select()
        .from(conversations)
        .where(sql`${conversations.userId} = ${testUserId}`);

      expect(createdConversations).toHaveLength(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request("/api/conversations/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Hello",
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request("/api/conversations/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          message: "", // Empty message
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/conversations", () => {
    let testConversationId: number;

    beforeEach(async () => {
      // Create a test conversation
      const [conversation] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Test Conversation",
        })
        .returning();
      testConversationId = conversation!.id;
    });

    it("should send a message to existing conversation", async () => {
      const res = await app.request("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          message: {
            id: "msg-123",
            role: "user",
            parts: [{ type: "text", text: "Hello AI" }],
          },
          conversationId: testConversationId,
          modelProvider: "gpt-4o",
          isRag: false,
        }),
      });

      expect(res.status).toBe(200);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            id: "msg-123",
            role: "user",
            parts: [{ type: "text", text: "Hello AI" }],
          },
          conversationId: testConversationId,
          modelProvider: "gpt-4o",
          isRag: false,
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          message: {
            id: "msg-123",
            role: "user",
            parts: [{ type: "text", text: "Hello AI" }],
          },
          // Missing conversationId
          modelProvider: "gpt-4o",
          isRag: false,
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/conversations", () => {
    beforeEach(async () => {
      // Create test conversations for testUser
      await db.insert(conversations).values({
        userId: testUserId,
        title: "Conversation 1",
      });
      await db.insert(conversations).values({
        userId: testUserId,
        title: "Conversation 2",
      });
      await db.insert(conversations).values({
        userId: testUserId,
        title: "Another Topic",
      });
      await db.insert(conversations).values({
        userId: anotherUserId,
        title: "Other User Conversation",
      });
    });

    it("should return paginated conversations for authenticated user", async () => {
      const res = await app.request(
        "/api/conversations?limit=10&direction=desc",
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
      expect(body.data.totalElements).toBe(3);
    });

    it("should filter conversations by title", async () => {
      const res = await app.request(
        "/api/conversations?limit=10&direction=desc&filter=Conversation",
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
    });

    it("should respect pagination limit", async () => {
      const res = await app.request(
        "/api/conversations?limit=2&direction=desc",
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.data.items).toHaveLength(2);
      expect(body.data.hasNext).toBe(true);
      expect(body.data.nextCursor).toBeDefined();
    });

    it("should support cursor-based pagination", async () => {
      // Get first page
      const firstRes = await app.request(
        "/api/conversations?limit=2&direction=desc",
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      const firstBody = (await firstRes.json()) as any;
      console.log("🚀 ~ firstBody:", JSON.stringify(firstBody, null, 2));
      const cursor = firstBody.data.nextCursor;

      // Get second page
      const secondRes = await app.request(
        `/api/conversations?limit=2&direction=desc&cursor=${cursor}`,
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(secondRes.status).toBe(200);

      const secondBody = (await secondRes.json()) as any;
      expect(secondBody.data.items).toHaveLength(1);
      expect(secondBody.data.hasNext).toBe(false);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        "/api/conversations?limit=10&direction=desc",
      );

      expect(res.status).toBe(401);
    });

    it("should return 400 for missing required parameters", async () => {
      const res = await app.request("/api/conversations", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/conversations/:conversationId", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Original Title",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Conversation",
        })
        .returning();
      anotherConversationId = conversation2!.id;
    });

    it("should update conversation title", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            title: "Updated Title",
          }),
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify conversation was updated
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(sql`${conversations.id} = ${testConversationId}`);

      expect(conversation!.title).toBe("Updated Title");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Updated Title",
          }),
        },
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to update another user's conversation", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            title: "Updated Title",
          }),
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            title: "", // Empty title
          }),
        },
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/api/conversations/99999", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          title: "Updated Title",
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/conversations/:conversationId", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Conversation to Delete",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Conversation",
        })
        .returning();
      anotherConversationId = conversation2!.id;

      // Create test messages for testConversation
      await db.insert(messages).values([
        {
          messageId: "msg-1",
          conversationId: testConversationId,
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
        {
          messageId: "msg-2",
          conversationId: testConversationId,
          role: "assistant",
          parts: [{ type: "text", text: "Hi there!" }],
        },
      ]);
    });

    it("should delete conversation and its messages", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify conversation was deleted
      const deletedConversations = await db
        .select()
        .from(conversations)
        .where(sql`${conversations.id} = ${testConversationId}`);

      expect(deletedConversations).toHaveLength(0);

      // Verify messages were deleted (cascade)
      const deletedMessages = await db
        .select()
        .from(messages)
        .where(sql`${messages.conversationId} = ${testConversationId}`);

      expect(deletedMessages).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}`,
        {
          method: "DELETE",
        },
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to delete another user's conversation", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/api/conversations/99999", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/conversations/:conversationId/favorites", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Conversation to Favorite",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Conversation",
        })
        .returning();
      anotherConversationId = conversation2!.id;
    });

    it("should add conversation to favorites", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/favorites`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(201);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify favorite was created
      const favorites = await db
        .select()
        .from(favoriteConversations)
        .where(
          sql`${favoriteConversations.userId} = ${testUserId} AND ${favoriteConversations.conversationId} = ${testConversationId}`,
        );

      expect(favorites).toHaveLength(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/favorites`,
        {
          method: "POST",
        },
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to favorite another user's conversation", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}/favorites`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/api/conversations/99999/favorites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/conversations/favorites", () => {
    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Favorite Conversation 1",
        })
        .returning();

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Favorite Conversation 2",
        })
        .returning();

      const [conversation3] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Non-Favorite Conversation",
        })
        .returning();

      const [conversation4] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Favorite",
        })
        .returning();

      // Add favorites
      await db.insert(favoriteConversations).values([
        {
          userId: testUserId,
          conversationId: conversation1!.id,
        },
        {
          userId: testUserId,
          conversationId: conversation2!.id,
        },
        {
          userId: anotherUserId,
          conversationId: conversation4!.id,
        },
      ]);
    });

    it("should return all favorite conversations for authenticated user", async () => {
      const res = await app.request("/api/conversations/favorites", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request("/api/conversations/favorites");

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/conversations/:conversationId/favorites", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Favorite Conversation",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Favorite",
        })
        .returning();
      anotherConversationId = conversation2!.id;

      // Add favorites
      await db.insert(favoriteConversations).values([
        {
          userId: testUserId,
          conversationId: testConversationId,
        },
        {
          userId: anotherUserId,
          conversationId: anotherConversationId,
        },
      ]);
    });

    it("should remove conversation from favorites", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/favorites`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify favorite was removed
      const favorites = await db
        .select()
        .from(favoriteConversations)
        .where(
          sql`${favoriteConversations.userId} = ${testUserId} AND ${favoriteConversations.conversationId} = ${testConversationId}`,
        );

      expect(favorites).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/favorites`,
        {
          method: "DELETE",
        },
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to remove favorite from another user's conversation", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}/favorites`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/api/conversations/99999/favorites", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/conversations/:conversationId/messages", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Test Conversation",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Conversation",
        })
        .returning();
      anotherConversationId = conversation2!.id;

      // Create test messages
      await db.insert(messages).values([
        {
          messageId: "msg-1",
          conversationId: testConversationId,
          role: "user",
          parts: [{ type: "text", text: "Message 1" }],
        },
        {
          messageId: "msg-2",
          conversationId: testConversationId,
          role: "assistant",
          parts: [{ type: "text", text: "Message 2" }],
        },
        {
          messageId: "msg-3",
          conversationId: testConversationId,
          role: "user",
          parts: [{ type: "text", text: "Message 3" }],
        },
      ]);
    });

    it("should delete messages from conversation", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/messages`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            userMessageId: "msg-1",
            aiMessageId: "msg-2",
          }),
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);

      // Verify messages were deleted
      const remainingMessages = await db
        .select()
        .from(messages)
        .where(sql`${messages.conversationId} = ${testConversationId}`);

      expect(remainingMessages.length).toBeLessThan(3);
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/messages`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessageId: "msg-1",
            aiMessageId: "msg-2",
          }),
        },
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to delete messages from another user's conversation", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}/messages`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            userMessageId: "msg-1",
            aiMessageId: "msg-2",
          }),
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 400 for invalid request body", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/messages`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            // Missing messageId
          }),
        },
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/conversations/:conversationId/messages", () => {
    let testConversationId: number;
    let anotherConversationId: number;

    beforeEach(async () => {
      // Create test conversations
      const [conversation1] = await db
        .insert(conversations)
        .values({
          userId: testUserId,
          title: "Test Conversation",
        })
        .returning();
      testConversationId = conversation1!.id;

      const [conversation2] = await db
        .insert(conversations)
        .values({
          userId: anotherUserId,
          title: "Other User Conversation",
        })
        .returning();
      anotherConversationId = conversation2!.id;

      // Create test messages
      await db.insert(messages).values([
        {
          messageId: "msg-1",
          conversationId: testConversationId,
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
        {
          messageId: "msg-2",
          conversationId: testConversationId,
          role: "assistant",
          parts: [{ type: "text", text: "Hi there!" }],
        },
        {
          messageId: "msg-3",
          conversationId: anotherConversationId,
          role: "user",
          parts: [{ type: "text", text: "Other user message" }],
        },
      ]);
    });

    it("should return all messages for a conversation", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(200);

      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].id).toBe("msg-1");
      expect(body.data[1].id).toBe("msg-2");
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await app.request(
        `/api/conversations/${testConversationId}/messages`,
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 if user tries to access another user's conversation messages", async () => {
      const res = await app.request(
        `/api/conversations/${anotherConversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${testApiKey}`,
          },
        },
      );

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/api/conversations/99999/messages", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      expect(res.status).toBe(404);
    });
  });
});
