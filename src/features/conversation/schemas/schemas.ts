import { z } from "@hono/zod-openapi";

export const ConversationParamSchema = z.object({
  conversationId: z.coerce.number(),
});

export const CreateConversationSchema = z.object({
  message: z.string().nonempty(),
});

export const UpdateConversationSchema = z.object({
  title: z.string().nonempty(),
});
