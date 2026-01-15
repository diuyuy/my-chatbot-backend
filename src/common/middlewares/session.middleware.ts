import { eq } from "drizzle-orm";
import { bearerAuth } from "hono/bearer-auth";
import { createMiddleware } from "hono/factory";
import { users } from "../db/schema/schema";
import type { Env } from "../types/types";

export const sessionMiddleware = createMiddleware<Env>(async (c, next) => {
  const db = c.get("db");

  const bearer = bearerAuth({
    verifyToken: async (token, c) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.apiKey, token));

      if (!user) {
        return false;
      }

      c.set("user", user);
      return true;
    },
  });

  return bearer(c, next);
});
