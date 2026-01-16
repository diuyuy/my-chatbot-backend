---
name: crud-writer
description: This is the guideline to follow when implementing CRUD features. Use them when implementing CRUD functionality.
---

# crud-writer

## Instructions

1. 주어진 OpenAPI 스펙을 참고해서 service 함수와 hono의 router handler 구현해주세요.
2. `zValidator`를 사용해서 검증하고, `c.req.valid()`를 사용해 검증된 데이터를 가져와주세요.
3. 만약 사용자의 접근 권한을 확인할 필요가 있는 경우 `{feature}Guard()` 미들웨어를 사용해주세요.
4. 핸들러에서 반환할 때 데이터를 `createSuccessResponse()` 함수로 wrapping 해서 반환해주세요.
5. DB 인스턴스는 PostgreSQL 기반 drizzle-orm DB 인스턴스 입니다. drizzle-orm의 SQL like 문법으로 모든 쿼리 작성해주세요.
6. DB 호출 과정에서 발생한 error는 `globalExceptionHandler`에서 처리하기 때문에 따로 처리하지 않아도 됩니다.
7. 테스트 코드는 우선 작성하지 말아주세요.
   
## Examples

### Example 1
```ts
conversationRoute.openAPIRegistry.registerPath({
    path: "/",
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
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

// service.ts
export const createConversation = async (
  db: DBType,
  userId: number,
  message: string
) => {
  const title = generateTitle(message);

  const [newConversation] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning();

  if (!newConversation) {
    throw new CommonHttpException(RESPONSE_STATUS.INTERNAL_SERVER_ERROR);
  }

  return { conversationId: newConversation.id };
};

// route.ts
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

```

### Example 2

```ts
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
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

//service.ts
export const updateConversationTitle = async (
  db: DBType,
  conversationId: number,
  { title }: UpdateConversationDto
) => {
  await db
    .update(conversations)
    .set({ title })
    .where(eq(conversations.id, conversationId));
};

// route.ts
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

```