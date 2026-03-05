import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Medicamentos table
export const medications = mysqlTable(
  "medications",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    registrationNumber: varchar("registrationNumber", { length: 20 }).notNull().unique(),
    concentration: varchar("concentration", { length: 255 }),
    pharmaceuticalForm: varchar("pharmaceuticalForm", { length: 255 }),
    holder: varchar("holder", { length: 255 }),
    category: mysqlEnum("category", [
      "medicamento",
      "vacina",
      "biológico",
      "fitoterápico",
      "homeopático",
      "outro",
    ]).default("medicamento"),
    status: mysqlEnum("status", ["ativo", "inativo", "atualizado"]).default("ativo"),
    lastUpdate: timestamp("lastUpdate").defaultNow(),
    dataSource: varchar("dataSource", { length: 255 }).default("ANVISA"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    registrationNumberIdx: index("idx_registrationNumber").on(table.registrationNumber),
    statusIdx: index("idx_status").on(table.status),
    lastUpdateIdx: index("idx_lastUpdate").on(table.lastUpdate),
  })
);

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

// Medication history table
export const medicationHistory = mysqlTable(
  "medicationHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    medicationId: int("medicationId").notNull(),
    previousName: text("previousName"),
    updateType: mysqlEnum("updateType", [
      "nome_alterado",
      "status_alterado",
      "novo_registro",
      "bula_atualizada",
    ]).notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    details: json("details"),
  },
  (table) => ({
    medicationIdIdx: index("idx_medicationId").on(table.medicationId),
    timestampIdx: index("idx_timestamp").on(table.timestamp),
  })
);

export type MedicationHistory = typeof medicationHistory.$inferSelect;
export type InsertMedicationHistory = typeof medicationHistory.$inferInsert;

// Search history table
export const searchHistory = mysqlTable(
  "searchHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    query: text("query").notNull(),
    resultsCount: int("resultsCount").default(0),
    filters: json("filters"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    timestampIdx: index("idx_timestamp").on(table.timestamp),
  })
);

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

// Notifications table
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", [
      "novo_medicamento",
      "atualizacao_detectada",
      "alerta_sistema",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    isRead: boolean("isRead").default(false),
    medicationId: int("medicationId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    createdAtIdx: index("idx_createdAt").on(table.createdAt),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Admin logs table
export const adminLogs = mysqlTable(
  "adminLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    details: json("details"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_userId").on(table.userId),
    timestampIdx: index("idx_timestamp").on(table.timestamp),
  })
);

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
