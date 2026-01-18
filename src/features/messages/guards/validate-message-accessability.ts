import { and, eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { conversations, messages } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";

export const validateMessageAccessability = async (
  db: DBType,
  userId: number,
  conversationId: number,
  messageId: string,
) => {
  const [message] = await db
    .select({
      userId: conversations.userId,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.messageId, messageId),
      ),
    );

  if (!message) {
    throw new CommonHttpException(RESPONSE_STATUS.MESSAGE_NOT_FOUND);
  }

  if (message.userId !== userId) {
    throw new CommonHttpException(RESPONSE_STATUS.ACCESS_MESSAGE_DENIED);
  }
};
