import { eq } from "drizzle-orm";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { documentResources } from "../../../common/db/schema/schema";
import { CommonHttpException } from "../../../common/error/common-http-exception";
import type { DBType } from "../../../common/types/types";

export const validateResourceAccessability = async (
  db: DBType,
  userId: number,
  resourceId: number
) => {
  const [resource] = await db
    .select()
    .from(documentResources)
    .where(eq(documentResources.id, resourceId));

  if (!resource) {
    throw new CommonHttpException(RESPONSE_STATUS.RESOURCE_NOT_FOUND);
  }

  if (resource.userId !== userId) {
    throw new CommonHttpException(RESPONSE_STATUS.ACCESS_RESOURCE_DENIED);
  }
};
