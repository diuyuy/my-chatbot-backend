import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import type { Env } from "../../common/types/types";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import { conversationGuard } from "./guard/conversation-guard";
import { registerConversationPaths } from "./register-paths";
import {
  ConversationPaginationQuerySchema,
  ConversationParamSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
} from "./schemas/schemas";
import {
  createConversation,
  deleteConversation,
  findAllConversations,
  updateConversationTitle,
} from "./services/conversation.service";
import {
  addFavorite,
  findAllFavorites,
  removeFavorite,
} from "./services/favorite-conversation.service";

const conversationRoute = new OpenAPIHono<Env>();

registerConversationPaths(conversationRoute);

conversationRoute.post(
  "/",
  zValidator("json", CreateConversationSchema, zodValidationHook),
  async (c) => {
    const user = c.get("user");
    const { message } = c.req.valid("json");
    const db = c.get("db");

    const result = await createConversation(db, user.id, message);

    return c.json(
      createSuccessResponse(RESPONSE_STATUS.CONVERSATION_CREATED, result),
      201
    );
  }
);

conversationRoute.get(
  "/",
  zValidator("query", ConversationPaginationQuerySchema, zodValidationHook),
  async (c) => {
    const paginationInfo = c.req.valid("query");
    const user = c.get("user");
    const db = c.get("db");

    const result = await findAllConversations(db, user.id, paginationInfo);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  }
);

conversationRoute.patch(
  "/:conversationId",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  zValidator("json", UpdateConversationSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");
    const updateConversationDto = c.req.valid("json");
    const db = c.get("db");

    await updateConversationTitle(db, conversationId, updateConversationDto);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  }
);

conversationRoute.delete(
  "/:conversationId",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");
    const db = c.get("db");

    const result = await deleteConversation(db, conversationId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  }
);

// Favorite Conversation
conversationRoute.post(
  "/:conversationId/favorites",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");
    const user = c.get("user");
    const db = c.get("db");

    await addFavorite(db, user.id, conversationId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 201);
  }
);

conversationRoute.get("/favorites", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  const result = await findAllFavorites(db, user.id);

  return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
});

conversationRoute.delete(
  "/:conversationId/favorites",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");
    const user = c.get("user");
    const db = c.get("db");

    await removeFavorite(db, user.id, conversationId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  }
);

export default conversationRoute;
