import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import type { Env } from "../../common/types/types";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import type { MyUIMessage } from "../ai/types/types";
import { DeleteMessageSchema } from "../messages/schemas/schemas";
import {
  deleteMessageById,
  findMessagesByConversationId,
} from "../messages/services/message.service";
import { conversationGuard } from "./guard/conversation-guard";
import { registerFavoriteConversationPaths } from "./register-paths/register-favorite-conversation-paths";
import { registerConversationPaths } from "./register-paths/register-paths";
import {
  ConversationPaginationQuerySchema,
  ConversationParamSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
} from "./schemas/schemas";
import { SendMessageSchema } from "./schemas/send-message-schema";
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
import { generateAIResponse } from "./services/generate-ai-response";

const conversationRoute = new OpenAPIHono<Env>();

registerConversationPaths(conversationRoute);
registerFavoriteConversationPaths(conversationRoute);

// Create New Conversation
conversationRoute.post(
  "/new",
  zValidator("json", CreateConversationSchema, zodValidationHook),
  async (c) => {
    const user = c.get("user");
    const { message } = c.req.valid("json");
    const db = c.get("db");

    const result = await createConversation(db, user.id, message);

    return c.json(
      createSuccessResponse(RESPONSE_STATUS.CONVERSATION_CREATED, result),
      201,
    );
  },
);

// Handle Sent Message
conversationRoute.post(
  "/",
  zValidator("json", SendMessageSchema, zodValidationHook),
  async (c) => {
    const { message, ...aiResponseOption } = c.req.valid("json");

    const user = c.get("user");
    const db = c.get("db");

    return generateAIResponse(
      db,
      user.id,
      message as MyUIMessage,
      aiResponseOption,
    );
  },
);

conversationRoute.get(
  "/",
  zValidator("query", ConversationPaginationQuerySchema, zodValidationHook),
  async (c) => {
    const paginationOption = c.req.valid("query");
    const user = c.get("user");
    const db = c.get("db");

    const result = await findAllConversations(db, user.id, paginationOption);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  },
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
  },
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
  },
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
  },
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
  },
);

// Delete Previous Messages
conversationRoute.delete(
  "/:conversationId/messages",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  zValidator("json", DeleteMessageSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const deleteMessageDto = c.req.valid("json");

    const { conversationId } = c.req.valid("param");
    const db = c.get("db");

    await deleteMessageById(db, conversationId, deleteMessageDto);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  },
);

//Get Messages in conversation
conversationRoute.get(
  "/:conversationId/messages",
  zValidator("param", ConversationParamSchema, zodValidationHook),
  conversationGuard,
  async (c) => {
    const { conversationId } = c.req.valid("param");

    const db = c.get("db");

    const result = await findMessagesByConversationId(db, conversationId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  },
);

export default conversationRoute;
