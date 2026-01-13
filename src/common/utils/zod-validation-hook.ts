import type { Context } from "hono";

export const zodValidationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) {
    return c.json(
      {
        success: false,
        code: "REQUEST_VALIDATION_ERROR",
        message: "유효하지 않은 요청 형식입니다.",
      } as const,
      400
    );
  }
};
