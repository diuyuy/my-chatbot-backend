import { z } from "@hono/zod-openapi";

export const createPaginationSchema = <T extends z.ZodType>(schema: T) => {
  return z.object({
    items: z.array(schema),
    nextCursor: z.union([z.base64(), z.null()]),
    totalElements: z.number().openapi({ example: 100 }),
    hasNext: z.boolean().openapi({ example: true }),
  });
};
