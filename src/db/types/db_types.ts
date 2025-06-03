import { z } from "zod";

// Base schemas for database tables - removed userSchema since we're using Clerk

export const tagSchema = z.object({
    id: z.number().int().positive(),
    tagName: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
    userId: z.string().min(1, "User ID is required"), // Changed to string for Clerk user IDs
    createdAt: z.string().datetime()
});

export const expenseSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    amount: z.number().int().positive("Amount must be positive (in cents)"),
    userId: z.string().min(1, "User ID is required"), // Changed to string for Clerk user IDs
    createdAt: z.string().datetime()
});

export const expenseTagSchema = z.object({
    id: z.number().int().positive(),
    expenseId: z.number().int().positive("Expense ID must be positive"),
    tagId: z.number().int().positive("Tag ID must be positive"),
    createdAt: z.string().datetime()
});

// Insert schemas (for creating new records - without id and createdAt)
export const insertTagSchema = tagSchema.omit({ 
    id: true, 
    createdAt: true 
});

export const insertExpenseSchema = expenseSchema.omit({ 
    id: true, 
    createdAt: true 
});

export const insertExpenseTagSchema = expenseTagSchema.omit({ 
    id: true, 
    createdAt: true 
});

// Update schemas (all fields optional except id)
export const updateTagSchema = tagSchema.partial().required({ id: true });
export const updateExpenseSchema = expenseSchema.partial().required({ id: true });

// API-specific schemas
export const createExpenseWithTagsSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    amount: z.number().positive("Amount must be positive").transform(val => Math.round(val * 100)), // Convert dollars to cents
    tagIds: z.array(z.number().int().positive()).optional().default([]),
    createdAt: z.string().datetime().optional() // Optional custom date for backdating
    // Removed userId since it will come from Clerk authentication
});

export const createTagSchema = z.object({
    tagName: z.string().min(1, "Tag name is required").max(30, "Tag name too long").trim()
    // Removed userId since it will come from Clerk authentication
});

// Query parameter schemas
export const getUserExpensesQuerySchema = z.object({
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive().max(100)).optional().default("20"),
    offset: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(0)).optional().default("0"),
    tagId: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional()
    // Removed userId since it will come from Clerk authentication
});

export const getExpenseByIdSchema = z.object({
    id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive())
});

// Response schemas (with relations) - removed user relations since we're using Clerk
export const expenseWithTagsSchema = expenseSchema.extend({
    expenseTags: z.array(z.object({
        tag: tagSchema
    })).optional()
});

export const tagWithUsageSchema = tagSchema.extend({
    usageCount: z.number().int().min(0),
    totalAmount: z.number().int().min(0)
});

// Bulk operation schemas
export const bulkCreateExpensesSchema = z.object({
    expenses: z.array(createExpenseWithTagsSchema).min(1, "At least one expense required").max(50, "Too many expenses")
});

export const bulkDeleteExpensesSchema = z.object({
    expenseIds: z.array(z.number().int().positive()).min(1, "At least one expense ID required")
    // Removed userId since it will come from Clerk authentication
});

// Error response schema
export const errorResponseSchema = z.object({
    error: z.string(),
    message: z.string(),
    details: z.any().optional()
});

// Success response schema
export const successResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional()
});

// Type exports for TypeScript - removed User types since we're using Clerk
export type Tag = z.infer<typeof tagSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseTag = z.infer<typeof expenseTagSchema>;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertExpenseTag = z.infer<typeof insertExpenseTagSchema>;

export type UpdateTag = z.infer<typeof updateTagSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;

export type CreateExpenseWithTags = z.infer<typeof createExpenseWithTagsSchema>;
export type CreateTag = z.infer<typeof createTagSchema>;

export type ExpenseWithTags = z.infer<typeof expenseWithTagsSchema>;
export type TagWithUsage = z.infer<typeof tagWithUsageSchema>;

export type GetUserExpensesQuery = z.infer<typeof getUserExpensesQuerySchema>;
export type GetExpenseByIdParams = z.infer<typeof getExpenseByIdSchema>;

export type BulkCreateExpenses = z.infer<typeof bulkCreateExpensesSchema>;
export type BulkDeleteExpenses = z.infer<typeof bulkDeleteExpensesSchema>;

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;