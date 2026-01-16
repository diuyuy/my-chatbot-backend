/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import { validateChunkAccessability } from "./validate-chunk-accessability";

describe("validateChunkAccessability", () => {
  const mockDB = {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should pass validation when chunk exists and userId matches", async () => {
      const userId = 1;
      const chunkId = 100;
      const mockChunk = {
        id: chunkId,
        userId: userId,
        content: "test content",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockChunk]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateChunkAccessability(mockDB as any, userId, chunkId)
      ).resolves.toBeUndefined();

      expect(mockDB.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("failure cases", () => {
    it("should throw CHUNK_NOT_FOUND error when chunk does not exist", async () => {
      const userId = 1;
      const chunkId = 999;

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateChunkAccessability(mockDB as any, userId, chunkId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.CHUNK_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.CHUNK_NOT_FOUND.status
        );
      }
    });

    it("should throw ACCESS_CHUNK_DENIED error when userId does not match", async () => {
      const userId = 1;
      const differentUserId = 2;
      const chunkId = 100;
      const mockChunk = {
        id: chunkId,
        userId: differentUserId,
        content: "test content",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockChunk]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateChunkAccessability(mockDB as any, userId, chunkId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.ACCESS_CHUNK_DENIED.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.ACCESS_CHUNK_DENIED.status
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should throw CHUNK_NOT_FOUND when query returns undefined chunk", async () => {
      const userId = 1;
      const chunkId = 100;

      const mockWhere = vi.fn().mockResolvedValue([undefined]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateChunkAccessability(mockDB as any, userId, chunkId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.CHUNK_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.CHUNK_NOT_FOUND.status
        );
      }
    });

    it("should pass validation when userId is 0 and matches chunk userId", async () => {
      const userId = 0;
      const chunkId = 100;
      const mockChunk = {
        id: chunkId,
        userId: 0,
        content: "test content",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockChunk]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateChunkAccessability(mockDB as any, userId, chunkId)
      ).resolves.toBeUndefined();
    });
  });
});
