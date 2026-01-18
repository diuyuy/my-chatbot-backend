/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { PaginationOption } from "../../../common/types/types";
import {
  createResource,
  deleteResource,
  findResourceById,
  findResources,
  updateResource,
} from "./resource.service";

const mockDB = {
  insert: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  delete: vi.fn(),
};

describe("resource.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createResource", () => {
    const userId = 1;
    const resourceName = "test-resource.pdf";
    const fileType = "pdf" as const;

    it("should create a resource and return its id", async () => {
      const mockResource = {
        id: 1,
        userId,
        name: resourceName,
        fileType,
        createdAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockResource]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (mockDB.insert as any).mockReturnValue({ values: mockValues });

      const result = await createResource(
        mockDB as any,
        userId,
        resourceName,
        fileType,
      );

      expect(mockDB.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId,
        name: resourceName,
        fileType,
      });
      expect(result).toBe(mockResource.id);
    });

    it("should throw CommonHttpException with INTERNAL_SERVER_ERROR when resource creation fails", async () => {
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (mockDB.insert as any).mockReturnValue({ values: mockValues });

      try {
        await createResource(mockDB as any, userId, resourceName, fileType);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.INTERNAL_SERVER_ERROR.code,
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.INTERNAL_SERVER_ERROR.status,
        );
      }
    });

    it("should throw CommonHttpException when returning undefined", async () => {
      const mockReturning = vi.fn().mockResolvedValue([undefined]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (mockDB.insert as any).mockReturnValue({ values: mockValues });

      try {
        await createResource(mockDB as any, userId, resourceName, fileType);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.INTERNAL_SERVER_ERROR.code,
        );
      }
    });
  });

  describe("findResources", () => {
    const userId = 1;
    const basePaginationOption: PaginationOption = {
      limit: 10,
      direction: "desc",
    };

    const mockResources = [
      {
        id: 1,
        userId,
        name: "resource1.pdf",
        fileType: "PDF",
        createdAt: new Date("2024-01-03"),
      },
      {
        id: 2,
        userId,
        name: "resource2.pdf",
        fileType: "PDF",
        createdAt: new Date("2024-01-02"),
      },
    ];

    const setupMockSelect = (resources: any[], countValue: number) => {
      const mockLimit = vi.fn().mockResolvedValue(resources);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any)
        .mockReturnValueOnce({ from: mockFrom })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: countValue }]),
          }),
        });
    };

    it("should return paginated resources without cursor", async () => {
      setupMockSelect(mockResources, 2);

      const result = await findResources(
        mockDB as any,
        userId,
        basePaginationOption,
      );

      expect(mockDB.select).toHaveBeenCalledTimes(2);
      expect(result.items).toHaveLength(2);
      expect(result.totalElements).toBe(2);
      expect(result.hasNext).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("should return paginated resources with next cursor when more items exist", async () => {
      const resourcesWithExtra = [
        ...mockResources,
        {
          id: 3,
          userId,
          name: "resource3.pdf",
          fileType: "PDF",
          createdAt: new Date("2024-01-01"),
        },
      ];
      const PaginationOption: PaginationOption = {
        limit: 2,
        direction: "desc",
      };

      setupMockSelect(resourcesWithExtra, 3);

      const result = await findResources(
        mockDB as any,
        userId,
        PaginationOption,
      );

      expect(result.items).toHaveLength(2);
      expect(result.hasNext).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });

    it("should filter resources by name when filter is provided", async () => {
      const filteredResources = [mockResources[0]];
      setupMockSelect(filteredResources, 1);

      const PaginationOption: PaginationOption = {
        ...basePaginationOption,
        filter: "resource1",
      };

      const result = await findResources(
        mockDB as any,
        userId,
        PaginationOption,
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalElements).toBe(1);
    });

    it("should handle ascending direction", async () => {
      const ascResources = [...mockResources].reverse();
      setupMockSelect(ascResources, 2);

      const PaginationOption: PaginationOption = {
        limit: 10,
        direction: "asc",
      };

      const result = await findResources(
        mockDB as any,
        userId,
        PaginationOption,
      );

      expect(result.items).toHaveLength(2);
    });

    it("should handle cursor with descending direction", async () => {
      const cursor = Buffer.from("2024-01-02T00:00:00.000Z").toString("base64");
      setupMockSelect(mockResources, 2);

      const PaginationOption: PaginationOption = {
        ...basePaginationOption,
        cursor,
      };

      const result = await findResources(
        mockDB as any,
        userId,
        PaginationOption,
      );

      expect(mockDB.select).toHaveBeenCalled();
      expect(result.items).toBeDefined();
    });

    it("should handle cursor with ascending direction", async () => {
      const cursor = Buffer.from("2024-01-02T00:00:00.000Z").toString("base64");
      setupMockSelect(mockResources, 2);

      const PaginationOption: PaginationOption = {
        limit: 10,
        direction: "asc",
        cursor,
      };

      const result = await findResources(
        mockDB as any,
        userId,
        PaginationOption,
      );

      expect(mockDB.select).toHaveBeenCalled();
      expect(result.items).toBeDefined();
    });

    it("should return empty items when no resources found", async () => {
      setupMockSelect([], 0);

      const result = await findResources(
        mockDB as any,
        userId,
        basePaginationOption,
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalElements).toBe(0);
      expect(result.hasNext).toBe(false);
    });

    it("should return totalElements as 0 when count returns undefined", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any)
        .mockReturnValueOnce({ from: mockFrom })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([undefined]),
          }),
        });

      const result = await findResources(
        mockDB as any,
        userId,
        basePaginationOption,
      );

      expect(result.totalElements).toBe(0);
    });

    it("should map resource items correctly excluding userId", async () => {
      setupMockSelect(mockResources, 2);

      const result = await findResources(
        mockDB as any,
        userId,
        basePaginationOption,
      );

      result.items.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("fileType");
        expect(item).toHaveProperty("createdAt");
        expect(item).not.toHaveProperty("userId");
      });
    });
  });

  describe("findResourceById", () => {
    const resourceId = 1;
    const mockResource = {
      id: resourceId,
      userId: 1,
      name: "test-resource.pdf",
      fileType: "PDF",
      createdAt: new Date("2024-01-01"),
    };

    const mockChunks = [
      {
        id: 1,
        content: "chunk content 1",
        tag: "section1",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: 2,
        content: "chunk content 2",
        tag: "section2",
        createdAt: new Date("2024-01-01"),
      },
    ];

    it("should return resource with its chunks", async () => {
      const mockWhere1 = vi.fn().mockResolvedValue([mockResource]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      const mockWhere2 = vi.fn().mockResolvedValue(mockChunks);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      (mockDB.select as any)
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 });

      const result = await findResourceById(mockDB as any, resourceId);

      expect(mockDB.select).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(mockResource.id);
      expect(result.userId).toBe(mockResource.userId);
      expect(result.name).toBe(mockResource.name);
      expect(result.fileType).toBe(mockResource.fileType);
      expect(result.createdAt).toBe(mockResource.createdAt);
      expect(result.embeddings).toEqual(mockChunks);
    });

    it("should throw CommonHttpException with RESOURCE_NOT_FOUND when resource does not exist", async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.select as any).mockReturnValue({ from: mockFrom });

      try {
        await findResourceById(mockDB as any, resourceId);
        expect.fail("Expected CommonHttpException to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CommonHttpException);
        expect((error as CommonHttpException).code).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.code,
        );
        expect((error as CommonHttpException).status).toBe(
          RESPONSE_STATUS.RESOURCE_NOT_FOUND.status,
        );
      }
    });

    it("should return resource with empty chunks when no chunks exist", async () => {
      const mockWhere1 = vi.fn().mockResolvedValue([mockResource]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      const mockWhere2 = vi.fn().mockResolvedValue([]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      (mockDB.select as any)
        .mockReturnValueOnce({ from: mockFrom1 })
        .mockReturnValueOnce({ from: mockFrom2 });

      const result = await findResourceById(mockDB as any, resourceId);

      expect(result.embeddings).toEqual([]);
    });
  });

  describe("updateResource", () => {
    const resourceId = 1;

    it("should update resource name", async () => {
      const updateDto = { name: "updated-name.pdf" };

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.update as any).mockReturnValue({ set: mockSet });

      await updateResource(mockDB as any, resourceId, updateDto);

      expect(mockDB.update).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ name: updateDto.name });
    });

    it("should complete without error when update succeeds", async () => {
      const updateDto = { name: "new-name.pdf" };

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (mockDB.update as any).mockReturnValue({ set: mockSet });

      await expect(
        updateResource(mockDB as any, resourceId, updateDto),
      ).resolves.toBeUndefined();
    });
  });

  describe("deleteResource", () => {
    const resourceId = 1;

    it("should delete resource by id", async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (mockDB.delete as any).mockReturnValue({ where: mockWhere });

      await deleteResource(mockDB as any, resourceId);

      expect(mockDB.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it("should complete without error when delete succeeds", async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      (mockDB.delete as any).mockReturnValue({ where: mockWhere });

      await expect(
        deleteResource(mockDB as any, resourceId),
      ).resolves.toBeUndefined();
    });
  });
});
