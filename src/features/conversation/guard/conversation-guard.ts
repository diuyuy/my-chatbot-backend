import { createMiddleware } from "hono/factory";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { Env } from "../../../common/types/types";
import { validateAccessibility } from "./validate-conversation-accessability";

export const conversationGuard = createMiddleware<Env>(async (c, next) => {
  const conversationId = c.req.param("conversationId");
  console.log("🚀 ~ conversationId:", conversationId);

  if (!conversationId) {
    throw new CommonHttpException(RESPONSE_STATUS.INVALID_REQUEST_FORMAT);
  }

  const user = c.get("user");

  await validateAccessibility(user.id, +conversationId);

  await next();
});
