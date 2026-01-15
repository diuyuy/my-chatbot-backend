import { createMiddleware } from "hono/factory";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { Env } from "../../../common/types/types";
import { validateResourceAccessability } from "./validate-resource-accessability";

export const resourceGuard = createMiddleware<Env>(async (c, next) => {
  const resourceId = c.req.param("resourceId");

  if (!resourceId) {
    throw new CommonHttpException(RESPONSE_STATUS.INVALID_REQUEST_FORMAT);
  }

  const db = c.get("db");
  const user = c.get("user");

  await validateResourceAccessability(db, user.id, +resourceId);

  await next();
});
