import { drizzle } from "drizzle-orm/node-postgres";

export const createDBInstance = () => {
  const dbURL = process.env.DATABASE_URL;

  if (!dbURL) {
    throw new Error("DB URL does not exist.");
  }

  return drizzle({
    connection: {
      connectionString: dbURL,
    },
  });
};
