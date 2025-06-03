import { relations, sql } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

// Remove the users table since we're using Clerk for user management
// Clerk provides user management, so we don't need a local users table

export const tags = sqliteTable("tags", {
    id: integer().primaryKey({ autoIncrement: true }),
    tagName: text("tag_name").notNull(),
    userId: text('user_id').notNull(), // Changed to text for Clerk user IDs
    createdAt: text("created_at")
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull()
});

export const expenses = sqliteTable("expenses", {
    id: integer().primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    amount: integer().notNull(),
    userId: text('user_id').notNull(), // Changed to text for Clerk user IDs
    createdAt: text("created_at")
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull()
});

// Junction table for many-to-many relationship between expenses and tags
export const expenseTags = sqliteTable("expense_tags", {
    id: integer().primaryKey({ autoIncrement: true }),
    expenseId: integer('expense_id').notNull(),
    tagId: integer('tag_id').notNull(),
    createdAt: text("created_at")
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull()
});

// Relations - removed user relations since we're using Clerk
export const tagsRelations = relations(tags, ({ many }) => ({
    expenseTags: many(expenseTags) // Tags can be linked to many expenses through junction table
}));

export const expensesRelations = relations(expenses, ({ many }) => ({
    expenseTags: many(expenseTags) // Expenses can have many tags through junction table
}));

export const expenseTagsRelations = relations(expenseTags, ({ one }) => ({
    expense: one(expenses, {
        fields: [expenseTags.expenseId],
        references: [expenses.id]
    }),
    tag: one(tags, {
        fields: [expenseTags.tagId],
        references: [tags.id]
    })
}));