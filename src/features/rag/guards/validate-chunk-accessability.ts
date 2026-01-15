import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { documentChunks } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";

export const validateChunkAccessability = async (
  db: DBType,
  userId: number,
  chunkId: number
) => {
  const [chunk] = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.id, chunkId));

  if (!chunk) {
    throw new CommonHttpException(RESPONSE_STATUS.CHUNK_NOT_FOUND);
  }

  if (chunk.userId !== userId) {
    throw new CommonHttpException(RESPONSE_STATUS.ACCESS_CHUNK_DENIED);
  }
};
