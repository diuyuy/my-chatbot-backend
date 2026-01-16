/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateEmbedding, generateEmbeddings } from "../../ai/ai.service";
import { createEmbedding, findRelevantContent } from "./rag.service";
import { createResource } from "./resource.service";

vi.mock("../../ai/ai.service", () => ({
  generateEmbeddings: vi.fn(),
  generateEmbedding: vi.fn(),
}));

vi.mock("./resource.service", () => ({
  createResource: vi.fn(),
}));

const mockDB = {
  insert: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
};

describe("rag.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEmbedding", () => {
    const userId = 1;
    const mockEmbeddingData = {
      content: "This is test content for embedding",
      resourceName: "test-document.pdf",
      docsLanguage: "markdown" as const,
    };

    const mockEmbeddings = [
      { content: "chunk 1", embedding: [0.1, 0.2, 0.3] },
      { content: "chunk 2", embedding: [0.4, 0.5, 0.6] },
    ];

    it("should create embedding with resource name and correct file type", async () => {
      (generateEmbeddings as any).mockResolvedValue(mockEmbeddings);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, mockEmbeddingData);

      expect(generateEmbeddings).toHaveBeenCalledWith(
        mockEmbeddingData.content,
        mockEmbeddingData.docsLanguage
      );
      expect(createResource).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        mockEmbeddingData.resourceName,
        "pdf"
      );
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        mockEmbeddings.map((embedding) => ({
          ...embedding,
          resourceId: 1,
          userId,
        }))
      );
    });

    it("should use content substring as resource name when resourceName is not provided", async () => {
      const dataWithoutName = {
        content:
          "This is a very long content string that exceeds 25 characters",
        docsLanguage: "markdown" as const,
      };

      (generateEmbeddings as any).mockResolvedValue(mockEmbeddings);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, dataWithoutName);

      expect(createResource).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        dataWithoutName.content.substring(0, 25),
        "text"
      );
    });

    it("should use 'text' as file type when resourceName is not provided", async () => {
      const dataWithoutName = {
        content: "Short content",
        docsLanguage: "markdown" as const,
      };

      (generateEmbeddings as any).mockResolvedValue(mockEmbeddings);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, dataWithoutName);

      expect(createResource).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        "Short content",
        "text"
      );
    });

    it("should correctly extract file extension from resource name", async () => {
      const dataWithTxt = {
        content: "Test content",
        resourceName: "document.txt",
        docsLanguage: "markdown" as const,
      };

      (generateEmbeddings as any).mockResolvedValue(mockEmbeddings);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, dataWithTxt);

      expect(createResource).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        "document.txt",
        "txt"
      );
    });

    it("should insert all embedding chunks with correct resourceId and userId", async () => {
      const multipleEmbeddings = [
        { content: "chunk 1", embedding: [0.1] },
        { content: "chunk 2", embedding: [0.2] },
        { content: "chunk 3", embedding: [0.3] },
      ];
      const resourceId = 42;

      (generateEmbeddings as any).mockResolvedValue(multipleEmbeddings);
      (createResource as any).mockResolvedValue(resourceId);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, mockEmbeddingData);

      expect(mockValues).toHaveBeenCalledWith([
        { content: "chunk 1", embedding: [0.1], resourceId, userId },
        { content: "chunk 2", embedding: [0.2], resourceId, userId },
        { content: "chunk 3", embedding: [0.3], resourceId, userId },
      ]);
    });

    it("should pass docsLanguage to generateEmbeddings", async () => {
      const dataWithLanguage = {
        content: "const x = 1;",
        resourceName: "code.ts",
        docsLanguage: "js" as const,
      };

      (generateEmbeddings as any).mockResolvedValue(mockEmbeddings);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, dataWithLanguage);

      expect(generateEmbeddings).toHaveBeenCalledWith(
        dataWithLanguage.content,
        dataWithLanguage.docsLanguage
      );
    });

    it("should handle empty embeddings array", async () => {
      (generateEmbeddings as any).mockResolvedValue([]);
      (createResource as any).mockResolvedValue(1);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

      mockDB.transaction.mockImplementation(async (callback: any) => {
        const tx = { insert: mockInsert };
        await callback(tx);
      });

      await createEmbedding(mockDB as any, userId, mockEmbeddingData);

      expect(mockValues).toHaveBeenCalledWith([]);
    });
  });

  describe("findRelevantContent", () => {
    const userId = 1;
    const content = "search query";
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

    it("should return joined content from relevant chunks", async () => {
      const mockChunks = [
        { content: "First relevant chunk" },
        { content: "Second relevant chunk" },
        { content: "Third relevant chunk" },
      ];

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue(mockChunks);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      const result = await findRelevantContent(mockDB as any, userId, content);

      expect(generateEmbedding).toHaveBeenCalledWith(content);
      expect(mockDB.select).toHaveBeenCalled();
      expect(result).toBe(
        "First relevant chunk\n\nSecond relevant chunk\n\nThird relevant chunk"
      );
    });

    it("should return empty string when no relevant chunks found", async () => {
      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      const result = await findRelevantContent(mockDB as any, userId, content);

      expect(result).toBe("");
    });

    it("should return single chunk content without separators", async () => {
      const mockChunks = [{ content: "Only one chunk" }];

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue(mockChunks);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      const result = await findRelevantContent(mockDB as any, userId, content);

      expect(result).toBe("Only one chunk");
    });

    it("should call generateEmbedding with the provided content", async () => {
      const searchQuery = "specific search query";

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await findRelevantContent(mockDB as any, userId, searchQuery);

      expect(generateEmbedding).toHaveBeenCalledWith(searchQuery);
    });

    it("should handle chunks with empty content", async () => {
      const mockChunks = [
        { content: "First chunk" },
        { content: "" },
        { content: "Third chunk" },
      ];

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue(mockChunks);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      const result = await findRelevantContent(mockDB as any, userId, content);

      expect(result).toBe("First chunk\n\n\n\nThird chunk");
    });

    it("should correctly filter by userId", async () => {
      const specificUserId = 42;

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await findRelevantContent(mockDB as any, specificUserId, content);

      expect(mockDB.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should handle content with special characters", async () => {
      const specialContent = "Query with special chars: @#$%^&*()";

      (generateEmbedding as any).mockResolvedValue(mockEmbedding);

      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await findRelevantContent(mockDB as any, userId, specialContent);

      expect(generateEmbedding).toHaveBeenCalledWith(specialContent);
    });
  });
});
