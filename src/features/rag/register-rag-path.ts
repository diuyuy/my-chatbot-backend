import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import { SuccessReponseSchema } from "../../common/schemas/common.schema";
import type { Env } from "../../common/types/types";
import { createErrorResponseSignature } from "../../common/utils/response-utils";
import { DocumentChunckSchema } from "./schema/rag.schema";
import {
  ResourceParamsSchema,
  ResourceSchema,
  UpdateResourceSchema,
} from "./schema/resource.schema";

export const registerRagPaths = (ragRoute: OpenAPIHono<Env>) => {
  ragRoute.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
  });

  ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "get",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: ResourceSchema.extend({
                embedding: z.array(DocumentChunckSchema),
              }),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "patch",
    request: {
      params: ResourceParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateResourceSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.null(),
            }),
          },
        },
        description: "요청 성공 응답",
      },
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_REQUEST_FORMAT),
      403: createErrorResponseSignature(RESPONSE_STATUS.ACCESS_RESOURCE_DENIED),
      404: createErrorResponseSignature(RESPONSE_STATUS.RESOURCE_NOT_FOUND),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
    security: [
      {
        Bearer: [],
      },
    ],
  });

  ragRoute.openAPIRegistry.registerPath({
    path: "/resources/:resourceId",
    method: "delete",
    request: {
      params: ResourceParamsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SuccessReponseSchema.extend({
              data: z.null(),
            }),
          },
        },
        description: "",
      },
    },
  });
};
