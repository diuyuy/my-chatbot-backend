import { and, asc, count, desc, eq, gt, ilike, isNull, lt } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import {
  conversations,
  favoriteConversations,
} from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType, PaginationOption } from "../../../common/types/types";
import { createCursor, parseCursor } from "../../../common/utils/cursor-utils";
import { createPaginationResponse } from "../../../common/utils/response-utils";
import type { UpdateConversationDto } from "../types/types";

export const createConversation = async (
  db: DBType,
  userId: number,
  message: string,
) => {
  const title = generateTitle(message);

  const [newConversation] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning();

  if (!newConversation) {
    throw new CommonHttpException(RESPONSE_STATUS.INTERNAL_SERVER_ERROR);
  }

  return { conversationId: newConversation.id };
};

export const findAllConversations = async (
  db: DBType,
  userId: number,
  paginationOption: PaginationOption & {
    includeFavorite?: boolean;
    filter?: string;
  },
) => {
  const decodedCursor = paginationOption.cursor
    ? parseCursor(paginationOption.cursor, "date")
    : null;

  const whereCondition = and(
    eq(conversations.userId, userId),
    !paginationOption.includeFavorite
      ? isNull(favoriteConversations.id)
      : undefined,
    paginationOption.filter
      ? ilike(conversations.title, `%${paginationOption.filter}%`)
      : undefined,
  );

  const result = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      favoriteId: favoriteConversations.id,
    })
    .from(conversations)
    .leftJoin(
      favoriteConversations,
      eq(conversations.id, favoriteConversations.conversationId),
    )
    .where(
      and(
        whereCondition,
        decodedCursor
          ? paginationOption.direction === "desc"
            ? lt(conversations.updatedAt, decodedCursor)
            : gt(conversations.updatedAt, decodedCursor)
          : undefined,
      ),
    )
    .orderBy(
      paginationOption.direction === "desc"
        ? desc(conversations.updatedAt)
        : asc(conversations.updatedAt),
    )
    .limit(paginationOption.limit + 1);

  const [counts] = await db
    .select({
      count: count(),
    })
    .from(conversations)
    .leftJoin(
      favoriteConversations,
      eq(conversations.id, favoriteConversations.conversationId),
    )
    .where(whereCondition);

  const totalElements = counts ? counts.count : 0;

  let lastValue: Date | undefined;

  if (result.length > paginationOption.limit) {
    result.pop();
    lastValue = result.at(-1)?.updatedAt;
  }

  const nextCursor = lastValue ? createCursor(lastValue) : null;

  const items = result.map(({ favoriteId, ...conversation }) => ({
    ...conversation,
    isFavorite: !!favoriteId,
  }));

  return createPaginationResponse(items, {
    nextCursor,
    totalElements,
    hasNext: !!nextCursor,
  });
};

export const updateConversationTitle = async (
  db: DBType,
  conversationId: number,
  { title }: UpdateConversationDto,
) => {
  await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId));
};

export const deleteConversation = async (
  db: DBType,
  conversationId: number,
) => {
  await db.delete(conversations).where(eq(conversations.id, conversationId));

  return { conversationId };
};

const generateTitle = (message: string) => {
  return message.length > 20 ? `${message.substring(0, 20)}...` : message;
};
