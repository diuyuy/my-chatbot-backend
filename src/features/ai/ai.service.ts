import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  convertToModelMessages,
  createIdGenerator,
  embed,
  embedMany,
  generateText,
  InvalidToolInputError,
  NoSuchToolError,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import {
  geminiModels,
  openaiModels,
} from "../../common/constants/model-providers";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import { CommonHttpException } from "../../common/error/common-http-exception";
import { SYSTEM_PROMPTS } from "./prompts/prompts";
import type { DocsLanguage, GenerateMessageOption } from "./types/types";

const getModel = (modelProvider: string) => {
  if (geminiModels.includes(modelProvider)) {
    return google(modelProvider);
  }

  if (openaiModels.includes(modelProvider)) {
    return openai(modelProvider);
  }

  throw new CommonHttpException(RESPONSE_STATUS.INVALID_REQUEST_FORMAT);
};

const myIdGenerator = createIdGenerator({
  prefix: "msg",
  size: 16,
});

export const generateUIMessageStreamResponse = async ({
  messages,
  modelProvider,
  onFinish,
  context,
}: GenerateMessageOption) => {
  return streamText({
    model: getModel(modelProvider),
    system: SYSTEM_PROMPTS.getSystemPrompt(context),
    messages: await convertToModelMessages(messages),
    experimental_transform: smoothStream(),
    stopWhen: stepCountIs(20),
  }).toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: myIdGenerator,
    messageMetadata: () => ({
      modelProvider,
    }),
    onFinish,
    onError: (error) => {
      if (NoSuchToolError.isInstance(error)) {
        return "The model tried to call a unknown tool.";
      } else if (InvalidToolInputError.isInstance(error)) {
        return "The model called a tool with invalid inputs.";
      } else if (error instanceof Error) {
        console.log(error.message);
        return error.message;
      } else {
        return "An unknown error occurred.";
      }
    },
  });
};

const embeddingModel = openai.embeddingModel("text-embedding-3-small");

const generateChunks = async (value: string, docsLanguage?: DocsLanguage) => {
  if (docsLanguage && docsLanguage !== "none") {
    const splitter = RecursiveCharacterTextSplitter.fromLanguage(docsLanguage);

    return splitter.splitText(value);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
    separators: [
      "\n\n",
      "\n",
      " ",
      ".",
      ",",
      "\u200b", // Zero-width space
      "\uff0c", // Fullwidth comma
      "\u3001", // Ideographic comma
      "\uff0e", // Fullwidth full stop
      "\u3002", // Ideographic stop
      "",
    ],
  });

  return splitter.splitText(value);
};

export const generateEmbeddings = async (
  value: string,
  docsLanguage?: DocsLanguage,
) => {
  const chunks = await generateChunks(value, docsLanguage);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((embedding, i) => ({
    content: chunks[i] ?? "",
    embedding,
  }));
};

export const generateEmbedding = async (value: string) => {
  const input = value.replaceAll("\\n", " ");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
};

export const translateToEnglish = async (query: string) => {
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: `If the following text is not in English, translate it to English. If it's already in English, return it as is: "${query}"`,
  });

  return text;
};
