import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { SuccessReponseSchema } from "../../../common/schemas/common.schema";
import type { Env } from "../../../common/types/types";
import { ConversationSchema } from "../schemas/schemas";

export const registerFavoriteConversationPaths = (
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

  // Favorite Conversation
  conversationRoute.openAPIRegistry.registerPath({
    path: "/:conversationId/favorites",
    method: "post",
    responses: {
      201: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.null(),
            }),
          },
        },
        description: "요청 성공 응답",
      },
    },
  });

  conversationRoute.openAPIRegistry.registerPath({
    path: "/favorites",
    method: "get",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.array(ConversationSchema),
            }),
          },
        },
        description: "요청 성공 응답",
      },
    },
  });

  conversationRoute.openAPIRegistry.registerPath({
    path: "/:conversationId/favorites",
    method: "delete",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.null(),
            }),
          },
        },
        description: "요청 성공 응답",
      },
    },
  });
};
