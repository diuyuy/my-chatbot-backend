import { createMiddleware } from "hono/factory";
import { createDBInstance } from "../db/create-db-instance";
import type { Env } from "../types/types";

export const setupDBMiddleware = createMiddleware<Env>(async (c, next) => {
  const db = createDBInstance();

  c.set("db", db);

  await next();
});
