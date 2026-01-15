import { and, eq } from "drizzle-orm";
import {
  conversations,
  favoriteConversations,
} from "../../../common/db/schema/schema";
import type { DBType } from "../../../common/types/types";

export const addFavorite = async (
  db: DBType,
  userId: number,
  conversationId: number
) => {
  await db
    .insert(favoriteConversations)
    .values({ userId, conversationId })
    .onConflictDoNothing({
      target: [
        favoriteConversations.userId,
        favoriteConversations.conversationId,
      ],
    });
};

export const findAllFavorites = async (db: DBType, userId: number) => {
  const result = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(favoriteConversations)
    .innerJoin(
      conversations,
      eq(favoriteConversations.conversationId, conversations.id)
    )
    .where(eq(favoriteConversations.userId, userId));

  return result.map((conversation) => ({
    ...conversation,
    isFavorite: true,
  }));
};

export const removeFavorite = async (
  db: DBType,
  userId: number,
  conversationId: number
) => {
  await db
    .delete(favoriteConversations)
    .where(
      and(
        eq(favoriteConversations.userId, userId),
        eq(favoriteConversations.conversationId, conversationId)
      )
    );
};
