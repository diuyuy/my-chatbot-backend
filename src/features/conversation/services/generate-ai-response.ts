import { TypeValidationError, validateUIMessages } from "ai";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";
import { generateUIMessageStreamResponse } from "../../ai/ai.service";
import type { MyUIMessage } from "../../ai/types/types";
import { metadataSchema } from "../../ai/types/types";
import {
  insertMessages,
  loadPreviousMessages,
} from "../../messages/services/message.service";
import { findRelevantContent } from "../../rag/services/rag.service";
import type { AIResponseOption } from "../types/types";

export const generateAIResponse = async (
  db: DBType,
  userId: number,
  message: MyUIMessage,
  { conversationId, modelProvider, isRag }: AIResponseOption,
) => {
  let context: string | undefined;

  if (isRag) {
    const msg = message.parts[0]?.type === "text" ? message.parts[0].text : "";
    context = await findRelevantContent(db, userId, msg);
  }

  try {
    const previousMessages = await loadPreviousMessages(db, conversationId);

    const validatedMessages = await validateUIMessages<MyUIMessage>({
      messages: [...previousMessages, message],
      metadataSchema,
    });

    return await generateUIMessageStreamResponse({
      conversationId,
      messages: validatedMessages,
      modelProvider,
      onFinish: async ({ messages }) => {
        await insertMessages(db, conversationId, messages.slice(-2));
      },
      context,
    });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.log("TypeValidation Error Occured");
      throw new CommonHttpException(RESPONSE_STATUS.INVALID_REQUEST_FORMAT);
    }

    console.error(error);
    throw new CommonHttpException(RESPONSE_STATUS.INTERNAL_SERVER_ERROR);
  }
};
