import { createMiddleware } from "hono/factory";
import { auth } from "../../features/auth/auth";
import { RESPONSE_STATUS } from "../constants/response-status";
import { CommonHttpException } from "../error/common-http-exception";
import type { Env } from "../types/types";

export const sessionMiddleware = createMiddleware<Env>(async (c, next) => {
  const sessionData = await auth.api.getSession();
  if (!sessionData) {
    throw new CommonHttpException(RESPONSE_STATUS.INVALID_SESSION);
  }

  c.set("session", sessionData.session);
  c.set("user", sessionData.user);

  await next();
});
