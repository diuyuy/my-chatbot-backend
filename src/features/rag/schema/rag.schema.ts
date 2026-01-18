import z from "zod";
import { DOCS_LANGUAGES } from "../../../common/constants/doc-languages";

export const CreateEmbeddingSchema = z.object({
  content: z.string().nonempty().openapi({ example: "안녕하세요." }),
  resourceName: z.string().optional().openapi({ example: "embedding.txt" }),
  docsLanguage: z
    .enum(DOCS_LANGUAGES)
    .optional()
    .openapi({ example: "markdown" }),
});

export const DocumentChunckSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  tag: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const ChunckParamsSchema = z.object({
  chunkId: z.coerce.number(),
});

export type CreateEmbeddingDto = z.infer<typeof CreateEmbeddingSchema>;
