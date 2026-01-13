/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import {
  createConversation,
  updateConversationTitle,
} from "./conversation.service";

vi.mock("../../common/db/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

const { db } = await import("../../../common/db/db");

describe("conversation.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createConversation", () => {
    const userId = "test-user-id";
    const message = "Hello, this is a test message";

    it("should create a conversation successfully with truncated title when message is longer than 20 characters", async () => {
      const mockConversation = {
        id: 1,
        userId,
        title: "Hello, this is a tes...",
        createdAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, message);

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId,
        title: "Hello, this is a tes...",
      });
      expect(conversationId).toBe(1);
    });

    it("should create a conversation with full message as title when message is 20 characters or less", async () => {
      const shortMessage = "Short message";
      const mockConversation = {
        id: 2,
        userId,
        title: shortMessage,
        createdAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, shortMessage);

      expect(mockValues).toHaveBeenCalledWith({
        userId,
        title: shortMessage,
      });
      expect(conversationId).toBe(2);
    });

    it("should create a conversation with full message as title when message is exactly 20 characters", async () => {
      const exactMessage = "12345678901234567890"; // exactly 20 chars
      const mockConversation = {
        id: 3,
        userId,
        title: exactMessage,
        createdAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, exactMessage);

      expect(mockValues).toHaveBeenCalledWith({
        userId,
        title: exactMessage,
      });
      expect(conversationId).toBe(3);
    });

    it("should handle empty message by creating conversation with empty title", async () => {
      const emptyMessage = "";
      const mockConversation = {
        id: 4,
        userId,
        title: "",
        createdAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockConversation]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const conversationId = await createConversation(userId, emptyMessage);

      expect(mockValues).toHaveBeenCalledWith({
        userId,
        title: "",
      });
      expect(conversationId).toBe(4);
    });

    it("should throw CommonHttpException when database insert fails to return a conversation", async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      try {
        await createConversation(userId, message);
        expect.fail("Should have thrown an exception");
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

    it("should throw CommonHttpException when database insert returns undefined", async () => {
      const mockReturning = vi.fn().mockResolvedValue([undefined]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      try {
        await createConversation(userId, message);
        expect.fail("Should have thrown an exception");
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
    const userId = "test-user-id";
    const conversationId = 1;
    const newTitle = "Updated Title";

    it("should update conversation title successfully when user has access", async () => {
      const mockWhere = vi.fn().mockResolvedValue([{ userId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any).mockReturnValue(mockSelect());

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      (db.update as any).mockReturnValue(mockUpdate());

      await updateConversationTitle(userId, conversationId, newTitle);

      expect(db.select).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ title: newTitle });
    });

    it("should throw CommonHttpException when conversation is not found", async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any).mockReturnValue(mockSelect());

      try {
        await updateConversationTitle(userId, conversationId, newTitle);
        expect.fail("Should have thrown an exception");
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

    it("should throw CommonHttpException when user does not own the conversation", async () => {
      const differentUserId = "different-user-id";
      const mockWhere = vi
        .fn()
        .mockResolvedValue([{ userId: differentUserId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any).mockReturnValue(mockSelect());

      try {
        await updateConversationTitle(userId, conversationId, newTitle);
        expect.fail("Should have thrown an exception");
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

    it("should handle empty title string", async () => {
      const emptyTitle = "";
      const mockWhere = vi.fn().mockResolvedValue([{ userId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any).mockReturnValue(mockSelect());

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      (db.update as any).mockReturnValue(mockUpdate());

      await updateConversationTitle(userId, conversationId, emptyTitle);

      expect(mockSet).toHaveBeenCalledWith({ title: emptyTitle });
    });

    it("should handle very long title strings", async () => {
      const longTitle = "a".repeat(1000);
      const mockWhere = vi.fn().mockResolvedValue([{ userId }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      (db.select as any).mockReturnValue(mockSelect());

      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      (db.update as any).mockReturnValue(mockUpdate());

      await updateConversationTitle(userId, conversationId, longTitle);

      expect(mockSet).toHaveBeenCalledWith({ title: longTitle });
    });
  });
});
