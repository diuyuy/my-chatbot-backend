import type { Context } from "hono";
import type { HTTPException } from "hono/http-exception";
import { RESPONSE_STATUS } from "../constants/response-status";
import { CommonHttpException } from "./common-http-exception";

export const globalExceptionHandler = (
  error: HTTPException | Error,
  c: Context
) => {
  if (error instanceof CommonHttpException) {
    console.error(error.message);
    return c.json(
      {
        success: false,
        code: error.code,
        message: error.message,
      },
      error.status
    );
  }

  console.error(error);

  return c.json(
    {
      success: false,
      code: 500,
      message: RESPONSE_STATUS.INTERNAL_SERVER_ERROR.message,
    },
    500
  );
};
