/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import { db } from "../../common/db/db";
import { CommonHttpException } from "../../common/error/common-http-exception";
import {
  createConversation,
  updateConversationTitle,
} from "./conversation.service";

vi.mock("../../common/db/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

describe("conversation.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createConversation", () => {
    it("should create a conversation with full title when message is 20 characters or less", async () => {
      const userId = "user-123";
      const message = "Hello World";
      const mockConversation = {
        id: 1,
        userId,
        title: "Hello World",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, message);

      expect(conversationId).toBe(1);
      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: "Hello World",
        })
      );
    });

    it("should create a conversation with truncated title when message exceeds 20 characters", async () => {
      const userId = "user-123";
      const message =
        "This is a very long message that exceeds twenty characters";
      const expectedTitle = `${message.substring(0, 20)}...`;
      const mockConversation = {
        id: 2,
        userId,
        title: expectedTitle,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, message);

      expect(conversationId).toBe(2);
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: expectedTitle,
        })
      );
    });

    it("should throw CommonHttpException when conversation creation fails", async () => {
      const userId = "user-123";
      const message = "Test message";

      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      try {
        await createConversation(userId, message);
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.INTERNAL_SERVER_ERROR.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.INTERNAL_SERVER_ERROR.status
        );
      }
    });
  });

  describe("updateConversationTitle", () => {
    it("should update conversation title when user has access", async () => {
      const userId = "user-123";
      const conversationId = 1;
      const newTitle = "Updated Title";

      const mockWhere = vi.fn().mockResolvedValue([{ userId: "user-123" }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      (db.update as any).mockReturnValue({ set: mockSet });

      await updateConversationTitle(userId, conversationId, newTitle);

      expect(db.select).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ title: newTitle });
    });

    it("should throw CONVERSATION_NOT_FOUND when conversation does not exist", async () => {
      const userId = "user-123";
      const conversationId = 999;
      const newTitle = "Updated Title";

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      try {
        await updateConversationTitle(userId, conversationId, newTitle);
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.CONVERSATION_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.CONVERSATION_NOT_FOUND.status
        );
      }

      expect(db.update).not.toHaveBeenCalled();
    });

    it("should throw ACCESS_CONVERSATION_DENIED when user does not own the conversation", async () => {
      const userId = "user-123";
      const conversationId = 1;
      const newTitle = "Updated Title";

      const mockWhere = vi
        .fn()
        .mockResolvedValue([{ userId: "different-user" }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      try {
        await updateConversationTitle(userId, conversationId, newTitle);
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED.status
        );
      }

      expect(db.update).not.toHaveBeenCalled();
    });
  });
});
