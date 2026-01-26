import { and, asc, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import type { ResouceType } from "../../../common/db/schema/enums";
import {
  documentChunks,
  documentResources,
} from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType, PaginationOption } from "../../../common/types/types";
import { createCursor, parseCursor } from "../../../common/utils/cursor-utils";
import { createPaginationResponse } from "../../../common/utils/response-utils";
import type { UpdateResourceDto } from "../schema/resource.schema";

export const createResource = async (
  db: DBType,
  userId: number,
  resourceName: string,
  fileType: ResouceType,
) => {
  const [newResouce] = await db
    .insert(documentResources)
    .values({
      userId,
      name: resourceName,
      fileType,
    })
    .returning();

  if (!newResouce) {
    throw new CommonHttpException(RESPONSE_STATUS.INTERNAL_SERVER_ERROR);
  }

  return newResouce.id;
};

export const findResources = async (
  db: DBType,
  userId: number,
  { cursor, limit, direction, filter }: PaginationOption,
) => {
  const decodedCursor = cursor ? parseCursor(cursor, "number") : null;

  const whereCodition = and(
    eq(documentResources.userId, userId),
    decodedCursor
      ? direction === "desc"
        ? lte(documentResources.id, decodedCursor)
        : gte(documentResources.id, decodedCursor)
      : undefined,
    filter ? ilike(documentResources.name, `%${filter}%`) : undefined,
  );

  const result = await db
    .select()
    .from(documentResources)
    .where(whereCodition)
    .orderBy(
      direction === "desc"
        ? desc(documentResources.id)
        : asc(documentResources.id),
    )
    .limit(limit + 1);

  const nextValue = result.length > limit ? result.pop()?.id : null;

  const nextCursor = nextValue ? createCursor(String(nextValue)) : null;

  const [counts] = await db
    .select({
      count: count(),
    })
    .from(documentResources)
    .where(
      and(
        eq(documentResources.userId, userId),
        filter ? ilike(documentResources.name, `%${filter}%`) : undefined,
      ),
    );

  const totalElements = counts ? counts.count : 0;

  const items = result.map(({ id, name, fileType, createdAt }) => ({
    id,
    name,
    fileType,
    createdAt,
  }));

  return createPaginationResponse(items, {
    nextCursor,
    totalElements,
    hasNext: !!nextCursor,
  });
};

export const findResourceById = async (db: DBType, resourceId: number) => {
  const [resource] = await db
    .select()
    .from(documentResources)
    .where(eq(documentResources.id, resourceId));

  if (!resource) {
    throw new CommonHttpException(RESPONSE_STATUS.RESOURCE_NOT_FOUND);
  }

  const chunks = await db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      tag: documentChunks.tag,
      createdAt: documentChunks.createdAt,
    })
    .from(documentChunks)
    .where(eq(documentChunks.resourceId, resourceId));

  return {
    id: resource.id,
    userId: resource.userId,
    name: resource.name,
    fileType: resource.fileType,
    createdAt: resource.createdAt,
    embeddings: chunks,
  };
};

export const updateResource = async (
  db: DBType,
  resourceId: number,
  { name }: UpdateResourceDto,
) => {
  await db
    .update(documentResources)
    .set({ name })
    .where(eq(documentResources.id, resourceId));
};

export const deleteResource = async (db: DBType, resourceId: number) => {
  await db
    .delete(documentResources)
    .where(eq(documentResources.id, resourceId));
};
