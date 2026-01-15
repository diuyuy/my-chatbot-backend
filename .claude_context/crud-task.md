# CURD Task

`.claude\skills\crud-writer\SKILL.md`를 참고하여 아래 OpenAPI 스펙 기반으로 `src\features\conversation\services\favorite-conversation.service.ts`에 CRUD 기능 구현해주세요.

```ts
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
```