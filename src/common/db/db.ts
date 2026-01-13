import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "../db/schema/auth-schema";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL ?? "",
    ssl: true,
  },
  schema: {
    ...authSchema,
  },
});
