import { createMiddleware } from "hono/factory";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { Env } from "../../../common/types/types";
import { validateChunkAccessability } from "./validate-chunk-accessability";

export const chunkGuard = createMiddleware<Env>(async (c, next) => {
  const chunkId = c.req.param("chunkId");

  if (!chunkId) {
    throw new CommonHttpException(RESPONSE_STATUS.INVALID_REQUEST_FORMAT);
  }

  const db = c.get("db");
  const user = c.get("user");

  await validateChunkAccessability(db, user.id, +chunkId);

  await next();
});
