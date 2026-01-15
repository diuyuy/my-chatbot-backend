import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import type { ResouceType } from "../../../common/db/schema/enums";
import { documentResources } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType, PaginationInfo } from "../../../common/types/types";
import { createCursor, parseCursor } from "../../../common/utils/cursor-utils";
import { createPaginationResponse } from "../../../common/utils/response-utils";

export const createResource = async (
  db: DBType,
  userId: number,
  resourceName: string,
  fileType: ResouceType
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
  { cursor, limit, direction }: PaginationInfo
) => {
  const decodedCursor = cursor ? parseCursor(cursor, "date") : null;

  const whereCodition = and(
    eq(documentResources.userId, userId),
    decodedCursor
      ? direction === "desc"
        ? lte(documentResources.createdAt, decodedCursor)
        : gte(documentResources.createdAt, decodedCursor)
      : undefined
  );

  const result = await db
    .select()
    .from(documentResources)
    .where(whereCodition)
    .orderBy(
      direction === "desc"
        ? desc(documentResources.createdAt)
        : asc(documentResources.createdAt)
    )
    .limit(limit + 1);

  const nextValue = result.length > limit ? result.pop()?.createdAt : null;

  const nextCursor = nextValue ? createCursor(nextValue.toISOString()) : null;

  const [counts] = await db
    .select({
      count: count(),
    })
    .from(documentResources)
    .where(whereCodition);

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
