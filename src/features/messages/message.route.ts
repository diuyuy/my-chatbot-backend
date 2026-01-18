import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import type { Env } from "../../common/types/types";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import { DeleteMessageSchema } from "./schemas/schemas";
import { deleteMessageById } from "./services/message.service";

const messageRoute = new OpenAPIHono<Env>();

messageRoute.delete(
  "/",
  zValidator("json", DeleteMessageSchema, zodValidationHook),
  async (c) => {
    const deleteMessageDto = c.req.valid("json");

    const user = c.get("user");
    const db = c.get("db");

    await deleteMessageById(db, user.id, deleteMessageDto);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  },
);

export default messageRoute;
