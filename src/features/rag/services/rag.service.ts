import { and, eq, innerProduct, lte, sql } from "drizzle-orm";
import path from "path";
import type { ResouceType } from "../../../common/db/schema/enums";
import { documentChunks } from "../../../common/db/schema/schema";
import type { DBType } from "../../../common/types/types";
import { generateEmbedding, generateEmbeddings } from "../../ai/ai.service";
import type { CreateEmbeddingDto } from "../schema/rag.schema";
import { createResource } from "./resource.service";

export const createEmbedding = async (
  db: DBType,
  userId: number,
  { resourceName, content, docsLanguage }: CreateEmbeddingDto,
) => {
  const filetype = resourceName
    ? (path.extname(resourceName).slice(1) as ResouceType)
    : "text";

  let isMarkdown = false;

  if (filetype === "md" || filetype === "markdown") {
    isMarkdown = true;
  }

  const embeddings = await generateEmbeddings(
    content,
    docsLanguage ?? (isMarkdown ? "markdown" : "none"),
  );

  await db.transaction(async (tx) => {
    const resourceId = await createResource(
      tx,
      userId,
      resourceName ?? content.substring(0, 25),
      filetype,
    );

    await tx
      .insert(documentChunks)
      .values(
        embeddings.map((embedding) => ({ ...embedding, resourceId, userId })),
      );
  });
};

export const findRelevantContent = async (
  db: DBType,
  userId: number,
  content: string,
) => {
  const userQueryEmbedded = await generateEmbedding(content);

  const similarity = sql<number>`${innerProduct(
    documentChunks.embedding,
    userQueryEmbedded,
  )}`;

  const result = await db
    .select()
    .from(documentChunks)
    .where(and(eq(documentChunks.userId, userId), lte(similarity, -0.6)))
    .orderBy(similarity);

  return result.map(({ content }) => content).join("\n\n");
};
