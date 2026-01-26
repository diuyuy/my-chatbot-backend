# CURD Task

`.claude\skills\crud-writer\SKILL.md`를 참고하여 아래 OpenAPI 스펙 기반으로 `src\features\auth\services\auth.service.ts`에 CRUD 기능 구현해주세요. 핸들러는 `src\features\auth\auth.route.ts`에 구현해주세요.

```ts
import { SignInSchema } from "../schemas/schemas";

authRoute.openAPIRegistry.registerPath({
  path: "/sign-in",
  method: "post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignInSchema,
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
    400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_API_KEY),
    500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
  },
});
```
