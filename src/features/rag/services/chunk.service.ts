import { eq } from "drizzle-orm";
import { documentChunks } from "../../../common/db/schema/schema";
import type { DBType } from "../../../common/types/types";

export const deleteChunkById = async (db: DBType, chunkId: number) => {
  await db.delete(documentChunks).where(eq(documentChunks.id, chunkId));
};
