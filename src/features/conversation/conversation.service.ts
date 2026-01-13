import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import { db } from "../../common/db/db";
import { conversations } from "../../common/db/schema/schema";
import { CommonHttpException } from "../../common/error/common-http-exception";

export const createConversation = async (userId: string, message: string) => {
  const title = generateTitle(message);

  const [newConversation] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning();

  if (!newConversation) {
    throw new CommonHttpException(RESPONSE_STATUS.INTERNAL_SERVER_ERROR);
  }

  return newConversation.id;
};

export const updateConversationTitle = async (
  userId: string,
  conversationId: number,
  title: string
) => {
  await validateAccessibility(userId, conversationId);

  await db.update(conversations).set({ title });
};

const generateTitle = (message: string) => {
  return message.length > 20 ? `${message.substring(0, 20)}...` : message;
};

const validateAccessibility = async (
  userId: string,
  conversationId: number
) => {
  const [result] = await db
    .select({
      userId: conversations.userId,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!result) {
    throw new CommonHttpException(RESPONSE_STATUS.CONVERSATION_NOT_FOUND);
  }

  if (result.userId !== userId) {
    throw new CommonHttpException(RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED);
  }
};
