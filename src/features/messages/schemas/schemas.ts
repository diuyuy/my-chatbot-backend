import z from "zod";

export const DeleteMessageSchema = z.object({
  conversationId: z.number(),
  userMessageId: z.string().nonempty(),
  aiMessageId: z.string().nonempty(),
});

export const MessageSchema = z.object({
  id: z.string().nonempty(),
});
