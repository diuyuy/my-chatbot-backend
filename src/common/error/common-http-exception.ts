import { HTTPException } from "hono/http-exception";
import type { ResponseStatus } from "../types/types";

export class CommonHttpException extends HTTPException {
  code: string;

  constructor({ status, code, message }: ResponseStatus) {
    super(status, { message });
    this.code = code;
  }
}
