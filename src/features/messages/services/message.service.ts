import { and, count, desc, eq, lte, or } from "drizzle-orm";
import { messages } from "../../../common/db/schema/schema";
import type { DBType, PaginationOption } from "../../../common/types/types";
import { parseCursor } from "../../../common/utils/cursor-utils";
import { createPaginationResponse } from "../../../common/utils/response-utils";
import type { MyUIMessage } from "../../ai/types/types";
import { validateMessageAccessability } from "../guards/validate-message-accessability";
import type { DeleteMessageDto } from "../types/types";

export const insertMessages = async (
  db: DBType,
  conversationId: number,
  uiMessages: MyUIMessage[],
) => {
  const msgs = uiMessages.map(({ id, ...rest }) => ({
    messageId: id,
    conversationId,
    ...rest,
  }));

  await db.insert(messages).values(msgs).onConflictDoNothing();
};

export const findAllMessages = async (
  db: DBType,
  conversationId: number,
  { cursor, limit }: PaginationOption,
) => {
  const decodedCursor = cursor ? parseCursor(cursor, "number") : null;

  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        decodedCursor ? lte(messages.id, decodedCursor) : undefined,
      ),
    )
    .orderBy(desc(messages.id))
    .limit(limit + 1);

  const nextValue = result.length > limit ? result.pop()?.id : null;

  const nextCursor = nextValue ? String(nextValue) : null;

  const [counts] = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const totalElements = counts?.count ?? 0;

  result.sort((a, b) => {
    if (a.createdAt === b.createdAt) {
      return a.role === "user" ? 1 : -1;
    }

    return a.createdAt > b.createdAt ? 1 : -1;
  });

  const items = result.map(({ messageId, role, parts, metadata }) => ({
    id: messageId,
    role,
    parts,
    metadata: metadata ?? undefined,
  }));

  return createPaginationResponse(items, {
    nextCursor,
    totalElements,
    hasNext: !!nextCursor,
  });
};

export const findMessagesByConversationId = async (
  db: DBType,
  conversationId: number,
) => {
  const result = await db
    .select({
      id: messages.messageId,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  return result.map(({ metadata, ...rest }) => ({
    ...rest,
    metadata: metadata ?? undefined,
  }));
};

export const loadPreviousMessages = async (
  db: DBType,
  conversationId: number,
) => {
  const result = await db
    .select({
      id: messages.messageId,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  return result.map(({ metadata, ...rest }) => ({
    ...rest,
    metadata: metadata ?? undefined,
  }));
};

export const deleteMessageById = async (
  db: DBType,
  userId: number,
  { conversationId, userMessageId, aiMessageId }: DeleteMessageDto,
) => {
  await validateMessageAccessability(db, userId, conversationId, userMessageId);
  await validateMessageAccessability(db, userId, conversationId, aiMessageId);

  await db
    .delete(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        or(
          eq(messages.messageId, userMessageId),
          eq(messages.messageId, aiMessageId),
        ),
      ),
    );
};
