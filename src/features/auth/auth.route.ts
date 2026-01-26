import { OpenAPIHono } from "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { RESPONSE_STATUS } from "../../common/constants/response-status";
import { createSuccessResponse } from "../../common/utils/response-utils";
import { zodValidationHook } from "../../common/utils/zod-validation-hook";
import type { Env } from "./../../common/types/types";
import { SignInSchema } from "./schemas/schemas";
import { signIn } from "./services/auth.service";

const authRoute = new OpenAPIHono<Env>();

authRoute.post(
  "/sign-in",
  zValidator("json", SignInSchema, zodValidationHook),
  async (c) => {
    const signInDto = c.req.valid("json");

    const db = c.get("db");

    await signIn(db, signInDto.apiKey);

    return c.json(createSuccessResponse(RESPONSE_STATUS.OK, null), 200);
  },
);

export default authRoute;
