import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import type { Env } from "../../common/types/types";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import { conversationGuard } from "./guard/conversation-guard";
import { registerConversationPaths } from "./register-paths";
import {
  ConversationParamSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
} from "./schemas/schemas";
import {
  createConversation,
  updateConversationTitle,
} from "./services/conversation.service";

const conversationRoute = new OpenAPIHono<Env>();

registerConversationPaths(conversationRoute);

conversationRoute.post(
  "/",
  zValidator("json", CreateConversationSchema, zodValidationHook),
  async (c) => {
    const user = c.get("user");
    const { message } = c.req.valid("json");
    const db = c.get("db");

    console.log("DB Type: ", typeof db);

    const conversationId = await createConversation(user.id, message);

    return c.json(
      createSuccessResponse(RESPONSE_STATUS.CONVERSATION_CREATED, {
        conversationId,
      }),
      201
    );
  }
);

conversationRoute.patch(
  "/:conversationId",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  zValidator("json", UpdateConversationSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");
    await updateConversationTitle(+conversationId, "ds");

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  }
);

export default conversationRoute;
