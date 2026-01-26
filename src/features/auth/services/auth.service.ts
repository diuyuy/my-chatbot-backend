import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { users } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";
export const signIn = async (db: DBType, apiKey: string) => {
  const [user] = await db.select().from(users).where(eq(users.apiKey, apiKey));

  if (!user) {
    throw new CommonHttpException(RESPONSE_STATUS.INVALID_API_KEY);
  }

  return true;
};
