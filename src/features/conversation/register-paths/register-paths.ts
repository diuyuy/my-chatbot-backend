import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { SuccessReponseSchema } from "../../../common/schemas/common.schema";
import type { Env } from "../../../common/types/types";
import { createErrorResponseSignature } from "../../../common/utils/response-utils";
import { createPaginationSchema } from "../../../common/utils/schema-utils";
import {
  ConversationPaginationQuerySchema,
  ConversationParamSchema,
  ConversationSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
} from "../schemas/schemas";

export const registerConversationPaths = (
  conversationRoute: OpenAPIHono<Env>
) => {
  conversationRoute.openAPIRegistry.registerComponent(
    "securitySchemes",
    "Bearer",
    {
      type: "http",
      scheme: "bearer",
    }
  );

  //Handle Sent Message
  conversationRoute.openAPIRegistry.registerPath({
    path: "/",
    method: "post",
    responses: {
      200: {
        content: {
          "text/event-stream": {
            schema: z.string(),
          },
        },
        description: "요청 성공 응답",
      },
    },
  });

  // Create New Conversation
  conversationRoute.openAPIRegistry.registerPath({
    path: "/new",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateConversationSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.object({
                conversationId: z.number(),
              }),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  // Get conversation by pagination
  conversationRoute.openAPIRegistry.registerPath({
    path: "/",
    method: "get",
    request: {
      query: ConversationPaginationQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: createPaginationSchema(ConversationSchema),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  // Update conversation title
  conversationRoute.openAPIRegistry.registerPath({
    path: "/:conversationId",
    method: "patch",
    request: {
      params: ConversationParamSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateConversationSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.null().openapi({ example: null }),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      403: createErrorResponseSignature(
        RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED
      ),
      404: createErrorResponseSignature(RESPONSE_STATUS.CONVERSATION_NOT_FOUND),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  conversationRoute.openAPIRegistry.registerPath({
    path: "/:conversationId",
    method: "delete",
    request: {
      params: ConversationParamSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.object({
                conversationId: z.number(),
              }),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      403: createErrorResponseSignature(
        RESPONSE_STATUS.ACCESS_CONVERSATION_DENIED
      ),
      404: createErrorResponseSignature(RESPONSE_STATUS.CONVERSATION_NOT_FOUND),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });
};
