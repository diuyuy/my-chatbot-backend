import { z } from "@hono/zod-openapi";

export const SuccessReponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "요청이 성공적으로 처리되었습니다." }),
});

export const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  code: z.string(),
  message: z.string(),
});
