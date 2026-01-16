/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import { validateResourceAccessability } from "./validate-resource-accessability";

describe("validateResourceAccessability", () => {
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
    it("should pass validation when resource exists and resourceId matches", async () => {
      const userId = 1;
      const resourceId = 100;
      const mockResource = {
        id: resourceId,
        userId: userId,
        name: "test-resource",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockResource]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateResourceAccessability(mockDB as any, userId, resourceId)
      ).resolves.toBeUndefined();

      expect(mockDB.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("failure cases", () => {
    it("should throw RESOURCE_NOT_FOUND error when resource does not exist", async () => {
      const userId = 1;
      const resourceId = 999;

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateResourceAccessability(mockDB as any, userId, resourceId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.status
        );
      }
    });

    it("should throw ACCESS_RESOURCE_DENIED error when resource.userId does not match userId", async () => {
      const userId = 1;
      const resourceId = 100;
      const differenctResourceId = 200;
      const mockResource = {
        id: resourceId,
        userId: differenctResourceId,
        name: "test-resource",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockResource]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateResourceAccessability(mockDB as any, userId, resourceId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.ACCESS_RESOURCE_DENIED.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.ACCESS_RESOURCE_DENIED.status
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should throw RESOURCE_NOT_FOUND when query returns undefined resource", async () => {
      const userId = 1;
      const resourceId = 100;

      const mockWhere = vi.fn().mockResolvedValue([undefined]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await validateResourceAccessability(mockDB as any, userId, resourceId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.code
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.status
        );
      }
    });

    it("should pass validation when resourceId is 0 and matches", async () => {
      const userId = 1;
      const resourceId = 0;
      const mockResource = {
        id: 0,
        userId: userId,
        name: "test-resource",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockResource]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      await expect(
        validateResourceAccessability(mockDB as any, userId, resourceId)
      ).resolves.toBeUndefined();
    });
  });
});
