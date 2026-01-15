/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import { validateAccessibility } from "./validate-conversation-accessability";

describe("validateAccessibility", () => {
  const mockDB = {
    select: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should pass when conversation exists and user has access", async () => {
      const userId = 1;
      const conversationId = 100;

      const mockWhere = vi.fn().mockResolvedValue([{ userId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateAccessibility(mockDB as any, userId, conversationId)
      ).resolves.toBeUndefined();

      expect(mockDB.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("failure cases", () => {
    it("should throw CONVERSATION_NOT_FOUND when conversation does not exist", async () => {
      const userId = 1;
      const conversationId = 999;

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateAccessibility(mockDB as any, userId, conversationId);
        expect.fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.CONVERSATION_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.CONVERSATION_NOT_FOUND.status
        );
      }
    });

    it("should throw ACCESS_CONVERSATION_DENIED when user does not own the conversation", async () => {
      const userId = 1;
      const ownerUserId = 2;
      const conversationId = 100;

      const mockWhere = vi.fn().mockResolvedValue([{ userId: ownerUserId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateAccessibility(mockDB as any, userId, conversationId);
        expect.fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED.status
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should pass when userId is 0 and matches conversation owner", async () => {
      const userId = 0;
      const conversationId = 100;

      const mockWhere = vi.fn().mockResolvedValue([{ userId: 0 }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateAccessibility(mockDB as any, userId, conversationId)
      ).resolves.toBeUndefined();
    });

    it("should throw when result is undefined", async () => {
      const userId = 1;
      const conversationId = 100;

      const mockWhere = vi.fn().mockResolvedValue([undefined]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateAccessibility(mockDB as any, userId, conversationId);
        expect.fail("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.CONVERSATION_NOT_FOUND.code
        );
      }
    });
  });
});
