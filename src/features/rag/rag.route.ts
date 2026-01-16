import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import type { Env } from "../../common/types/types";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import { resourceGuard } from "./guards/resource.guard";
import { registerRagPaths } from "./register-rag-path";
import { CreateEmbeddingSchema } from "./schema/rag.schema";
import {
  ResourcePaginationQuerySchema,
  ResourceParamsSchema,
  UpdateResourceSchema,
} from "./schema/resource.schema";
import { createEmbedding } from "./services/rag.service";
import {
  deleteResource,
  findResourceById,
  findResources,
  updateResource,
} from "./services/resource.service";

const ragRoute = new OpenAPIHono<Env>();

registerRagPaths(ragRoute);

ragRoute.post(
  "/",
  zValidator("json", CreateEmbeddingSchema, zodValidationHook),
  async (c) => {
    const createEmbeddingDto = c.req.valid("json");
    const user = c.get("user");
    const db = c.get("db");

    await createEmbedding(db, user.id, createEmbeddingDto);

    return c.json(
      createSuccessResponse(RESPONSE_STATUS.EMBEDDING_CREATED, null),
      201
    );
  }
);

ragRoute.get(
  "/resources",
  zValidator("query", ResourcePaginationQuerySchema, zodValidationHook),
  async (c) => {
    const { direction, ...restOption } = c.req.valid("query");

    const user = c.get("user");
    const db = c.get("db");

    const result = await findResources(db, user.id, {
      ...restOption,
      direction: direction ?? "desc",
    });

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  }
);

ragRoute.get(
  "/resources/:resourceId",
  zValidator("param", ResourceParamsSchema, zodValidationHook),
  resourceGuard,
  async (c) => {
    const { resourceId } = c.req.valid("param");
    const db = c.get("db");

    const result = await findResourceById(db, resourceId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, result), 200);
  }
);

ragRoute.patch(
  "/resources/:resourceId",
  zValidator("param", ResourceParamsSchema, zodValidationHook),
  zValidator("json", UpdateResourceSchema, zodValidationHook),
  resourceGuard,
  async (c) => {
    const { resourceId } = c.req.valid("param");
    const updateResourceDto = c.req.valid("json");
    const db = c.get("db");

    await updateResource(db, resourceId, updateResourceDto);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  }
);

ragRoute.delete(
  "/resources/:resourceId",
  zValidator("param", ResourceParamsSchema, zodValidationHook),
  resourceGuard,
  async (c) => {
    const { resourceId } = c.req.valid("param");
    const db = c.get("db");

    await deleteResource(db, resourceId);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  }
);

export default ragRoute;
