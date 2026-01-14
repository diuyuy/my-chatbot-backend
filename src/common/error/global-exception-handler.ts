import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
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

  if (error instanceof HTTPException) {
    if (error.status === 401) {
      return c.json(
        {
          success: false,
          code: RESPONSE_STATUS.INVALID_SESSION.code,
          message: RESPONSE_STATUS.INVALID_SESSION.message,
        },
        error.status
      );
    }
    return error.getResponse();
  }

  return c.json(
    {
      success: false,
      code: 500,
      message: RESPONSE_STATUS.INTERNAL_SERVER_ERROR.message,
    },
    500
  );
};
