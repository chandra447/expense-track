import { relations, sql } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

export const userCredits = sqliteTable("user_credits", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(), // Clerk user ID
  functionCallsUsed: integer("function_calls_used").notNull().default(0),
  messagesUsed: integer("messages_used").notNull().default(0),
  functionCallsLimit: integer("function_calls_limit").notNull().default(10), // Free tier: 10 function calls
  messagesLimit: integer("messages_limit").notNull().default(10), // Free tier: 10 messages
  isPremium: integer("is_premium").notNull().default(0), // SQLite uses 0/1 for boolean
  lastResetDate: text("last_reset_date")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const creditTransactions = sqliteTable("credit_transactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'function_call', 'message', 'reset', 'upgrade'
  amount: integer("amount").notNull(), // Credits consumed or added
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = typeof userCredits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert; 