import type { Session, User } from "better-auth";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Env {
  Bindings: {};
  Variables: {
    user: User;
    session: Session;
  };
}

export interface ResponseStatus {
  status: ContentfulStatusCode;
  code: string;
  message: string;
  description: string;
}

export interface PaginationOption {
  nextCursor: string | null;
  totalElements: number;
  hasNext: boolean;
}
