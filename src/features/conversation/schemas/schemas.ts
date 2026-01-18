import { z } from "@hono/zod-openapi";

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string().openapi({ example: "대화 1" }),
  createdAt: z.date(),
  updatedAt: z.date(),
  isFavorite: z.boolean(),
});

export const ConversationParamSchema = z.object({
  conversationId: z.coerce.number(),
});

export const CreateConversationSchema = z.object({
  message: z.string().nonempty(),
});

export const UpdateConversationSchema = z.object({
  title: z.string().nonempty(),
});

export const ConversationPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1),
  direction: z.union([z.literal("asc"), z.literal("desc")]),
  includeFavorite: z.coerce.boolean().optional(),
  filter: z.string().optional(),
});
