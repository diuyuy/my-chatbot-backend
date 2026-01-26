import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { RESPONSE_STATUS } from "../../../common/constants/response-status";
import { SuccessReponseSchema } from "../../../common/schemas/common.schema";
import type { Env } from "../../../common/types/types";
import { createErrorResponseSignature } from "../../../common/utils/response-utils";
import { SignInSchema } from "../schemas/schemas";

export const registerAuthPaths = (authRoute: OpenAPIHono<Env>) => {
  authRoute.openAPIRegistry.registerPath({
    path: "/sign-in",
    method: "post",
    request: {
      body: {
        content: {
          "application/json": {
            schema: SignInSchema,
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
      400: createErrorResponseSignature(RESPONSE_STATUS.INVALID_API_KEY),
      500: createErrorResponseSignature(RESPONSE_STATUS.INTERNAL_SERVER_ERROR),
    },
  });
};
