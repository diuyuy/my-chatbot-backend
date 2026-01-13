import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { db } from "../../../common/db/db";
import { conversations } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";

export const validateAccessibility = async (
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
