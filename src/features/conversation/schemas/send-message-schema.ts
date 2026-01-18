import z from "zod";
import {
  geminiModels,
  openaiModels,
} from "../../../common/constants/model-providers";

export const SendMessageSchema = z.object({
  message: z.unknown(),
  conversationId: z.number(),
  modelProvider: z.enum([...geminiModels, ...openaiModels]),
  isRag: z.boolean(),
});
