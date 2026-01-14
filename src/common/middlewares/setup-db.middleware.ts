import { drizzle } from "drizzle-orm/node-postgres";
import { createMiddleware } from "hono/factory";
import type { Env } from "../types/types";

export const setupDBMiddleware = createMiddleware<Env>(async (c, next) => {
  const db = drizzle({
    connection: {
      connectionString: process.env.DATABASE_URL ?? "",
    },
  });

  c.set("db", db);

  await next();
});
