import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  vector,
} from "drizzle-orm/pg-core";
import type { MyUIMessage } from "../../../features/ai/types/types";
import { messageRoleEnum, resourceTypeEnum } from "./enums";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  apiKey: text("apk_key").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_conversation_title_trgm").using(
      "gin",
      table.title.op("gin_trgm_ops")
    ),
    index("idx_conversation_updated_at").on(table.updatedAt),
  ]
);

export const favoriteConversations = pgTable(
  "favorite_conversations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id").references(
      () => conversations.id,
      {
        onDelete: "cascade",
      }
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_user_conversation").on(table.userId, table.conversationId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    messageId: text("message_id").notNull(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    metadata: jsonb("metadata").$type<MyUIMessage["metadata"]>(),
    parts: jsonb("parts").$type<MyUIMessage["parts"]>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_messages_created_at").on(table.createdAt)]
);

export const documentResources = pgTable(
  "document_resources",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fileType: resourceTypeEnum("file_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_document_resources_name_trgm").using(
      "gin",
      table.name.op("gin_trgm_ops")
    ),
  ]
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => documentResources.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    tag: text("tag"), // 문서 필터링 용 태그
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ip_index").using("hnsw", table.embedding.op("vector_ip_ops")),
  ]
);
