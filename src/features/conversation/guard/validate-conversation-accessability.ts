import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { conversations } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";

export const validateAccessibility = async (
  db: DBType,
  userId: number,
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
