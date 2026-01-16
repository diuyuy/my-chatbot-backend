import z from "zod";
import { resourceTypeEnum } from "../../../common/db/schema/enums";
import { SuccessReponseSchema } from "../../../common/schemas/common.schema";
import { createPaginationSchema } from "../../../common/utils/schema-utils";

export const ResourceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().openapi({ example: "embedding.txt" }),
  fileType: z.enum(resourceTypeEnum.enumValues),
  createdAt: z.coerce.date(),
});

export const ResourcePaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number(),
  direction: z.enum(["asc", "desc"]).optional(),
  filter: z.string().optional(),
});

export const ResourcePaginaitonSchema = SuccessReponseSchema.extend({
  data: createPaginationSchema(ResourceSchema),
});

export const ResourceParamsSchema = z.object({
  resourceId: z.coerce.number(),
});

export const UpdateResourceSchema = z.object({
  name: z.string().nonempty(),
});

export type EmbeddingResouce = z.infer<typeof ResourceSchema>;
export type ResourcePagination = z.infer<typeof ResourcePaginaitonSchema>;
export type UpdateResourceDto = z.infer<typeof UpdateResourceSchema>;
