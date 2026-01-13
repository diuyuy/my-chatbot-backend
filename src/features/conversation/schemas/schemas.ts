import z from "zod";

export const ConversationParamSchema = z.object({
  conversationId: z.coerce.number(),
});

export const CreateConversationSchema = z.object({
  message: z.string().nonempty(),
});

export const UpdateConversationSchema = z.object({
  title: z.string().nonempty(),
});
