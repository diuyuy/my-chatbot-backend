# CURD Task

`.claude\skills\crud-writer\SKILL.md`를 참고하여 아래 OpenAPI 스펙 기반으로 `src\features\rag\services\resource.service.ts`에 CRUD 기능 구현해주세요. 핸들러는 `src\features\rag\rag.route.ts`에 구현해주세요.

```ts
ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "get",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: ResourceSchema.extend({
                embedding: z.array(DocumentChunckSchema),
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

  ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "patch",
    request: {
      params: ResourceParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateResourceSchema,
          },
        },
      },
    },
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
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      403: createErrorResponseSignature(RESPONSE_STATUS.ACCESS_RESOURCE_DENIED),
      404: createErrorResponseSignature(RESPONSE_STATUS.RESOURCE_NOT_FOUND),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "delete",
    request: {
      params: ResourceParamsSchema,
    },
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
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      403: createErrorResponseSignature(RESPONSE_STATUS.ACCESS_RESOURCE_DENIED),
      404: createErrorResponseSignature(RESPONSE_STATUS.RESOURCE_NOT_FOUND),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });
```