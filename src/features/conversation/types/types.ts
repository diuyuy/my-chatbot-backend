import type z from "zod";
import type { UpdateConversationSchema } from "../schemas/schemas";

export type UpdateConversationDto = z.infer<typeof UpdateConversationSchema>;

export interface AIResponseOption {
  conversationId: number;
  modelProvider: string;
  isRag: boolean;
}
