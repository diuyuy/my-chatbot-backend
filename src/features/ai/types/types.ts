import type { UIMessage } from "ai";
import z from "zod";
import type { DOCS_LANGUAGES } from "../../../common/constants/doc-languages";

export const metadataSchema = z
  .object({
    modelProvider: z.string().nonempty(),
  })
  .optional();

export type MyMetadataPart = z.infer<typeof metadataSchema>;

export type MyUIMessage = UIMessage<MyMetadataPart>;

export interface GenerateMessageOption {
  conversationId: number;
  messages: MyUIMessage[];
  modelProvider: string;
  onFinish: (response: { messages: MyUIMessage[] }) => Promise<void>;
  context?: string;
}

export type DocsLanguage = (typeof DOCS_LANGUAGES)[number];
