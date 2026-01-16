import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Env {
  Bindings: {};
  Variables: {
    user: { id: number };
    db: DBType;
  };
}

export type DBType = NodePgDatabase;

export interface ResponseStatus {
  status: ContentfulStatusCode;
  code: string;
  message: string;
  description: string;
}

export interface PaginationInfo {
  cursor?: string;
  limit: number;
  direction: "asc" | "desc";
  filter?: string;
}

export interface PaginationOption {
  nextCursor: string | null;
  totalElements: number;
  hasNext: boolean;
}
