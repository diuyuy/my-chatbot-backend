import { drizzle } from "drizzle-orm/node-postgres";

export const createDBInstance = () =>
  drizzle({
    connection: {
      connectionString: process.env.DATABASE_URL ?? "",
    },
  });
