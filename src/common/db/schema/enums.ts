import { pgEnum } from "drizzle-orm/pg-core";

// Enums
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const fileTypeEnum = pgEnum("file_type", ["image", "audio", "pdf"]);

export const resourceTypeEnum = pgEnum("resource_type", ["text", "txt", "pdf"]);

export type MessageRole = (typeof messageRoleEnum.enumValues)[number];
export type ResouceType = (typeof resourceTypeEnum.enumValues)[number];
