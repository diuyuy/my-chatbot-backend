import { z } from "@hono/zod-openapi";

export const SignInSchema = z.object({
  apiKey: z.string().max(50).nonempty(),
});
