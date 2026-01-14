import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { conversations } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";

export const createConversation = async (
  db: DBType,
  userId: number,
  message: string
) => {
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
  db: DBType,
  conversationId: number,
  title: string
) => {
  await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId));
};

export const findAllConversations = async () => {};

const generateTitle = (message: string) => {
  return message.length > 20 ? `${message.substring(0, 20)}...` : message;
};
