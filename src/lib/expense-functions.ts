import db from '@/db';
import { expenses, tags, expenseTags } from '@/db/schema/expenses';
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm';

export interface CreateExpenseParams {
  userId: string;
  title: string;
  amount: number;
  tagNames?: string[];
  date?: string;
}

export interface SearchExpensesParams {
  userId: string;
  query?: string;
  minAmount?: number;
  maxAmount?: number;
  tagName?: string;
  limit?: number;
}

export interface CreateTagParams {
  userId: string;
  tagName: string;
}

// Reusable expense functions
export const expenseFunctions = {
  async createExpenseWithTags(params: CreateExpenseParams) {
    const { userId, title, amount, tagNames = [], date } = params;
    
    try {
      // Create the expense
      const expenseData: any = {
        title,
        amount,
        userId,
      };

      if (date) {
        expenseData.createdAt = new Date(date);
      }

      const [newExpense] = await db
        .insert(expenses)
        .values(expenseData)
        .returning();

      // Handle tags if provided
      const createdTags = [];
      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          // Check if tag exists
          let [existingTag] = await db.select().from(tags).where(
            and(eq(tags.userId, userId), eq(tags.tagName, tagName))
          );

          // Create tag if it doesn't exist
          if (!existingTag) {
            [existingTag] = await db.insert(tags).values({
              userId,
              tagName,
            }).returning();
          }

          // Link expense to tag
          await db.insert(expenseTags).values({
            expenseId: newExpense.id,
            tagId: existingTag.id,
          });

          createdTags.push(existingTag.tagName);
        }
      }

      return {
        success: true,
        expense: {
          ...newExpense,
          tags: createdTags,
        }
      };
    } catch (error) {
      console.error('Error creating expense:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async getExpensesSummary(userId: string) {
    try {
      // Get total expenses and count
      const [summary] = await db.select({
        totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(expenses).where(eq(expenses.userId, userId));

      // Get recent expenses
      const recentExpenses = await db.select({
        id: expenses.id,
        title: expenses.title,
        amount: expenses.amount,
        createdAt: expenses.createdAt,
      }).from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.createdAt))
        .limit(5);

      return {
        success: true,
        summary: {
          totalAmount: summary.totalAmount,
          count: summary.count,
          recentExpenses,
        }
      };
    } catch (error) {
      console.error('Error getting expenses summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async searchExpenses(params: SearchExpensesParams) {
    const { userId, query, minAmount, maxAmount, tagName, limit = 10 } = params;
    
    try {
      // Build conditions array
      const conditions = [eq(expenses.userId, userId)];
      
      if (query) {
        conditions.push(like(expenses.title, `%${query}%`));
      }
      
      if (minAmount !== undefined) {
        conditions.push(gte(expenses.amount, Math.round(minAmount * 100)));
      }
      
      if (maxAmount !== undefined) {
        conditions.push(lte(expenses.amount, Math.round(maxAmount * 100)));
      }

      // Execute query with all conditions
      const results = await db.select({
        id: expenses.id,
        title: expenses.title,
        amount: expenses.amount,
        createdAt: expenses.createdAt,
      }).from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.createdAt))
        .limit(limit);

      return {
        success: true,
        results,
        count: results.length,
      };
    } catch (error) {
      console.error('Error searching expenses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async getExpenseInsights(userId: string, period: 'week' | 'month' | 'year') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Get expenses for the period
      const periodExpenses = await db.select({
        amount: expenses.amount,
        createdAt: expenses.createdAt,
      }).from(expenses)
        .where(and(
          eq(expenses.userId, userId),
          gte(expenses.createdAt, startDate.toISOString())
        ));

      const totalAmount = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const averageAmount = periodExpenses.length > 0 ? totalAmount / periodExpenses.length : 0;

      // Calculate daily average for the period
      const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const dailyAverage = totalAmount / daysInPeriod;

      return {
        success: true,
        insights: {
          period,
          totalAmount,
          numberOfExpenses: periodExpenses.length,
          averageAmount,
          dailyAverage,
          daysInPeriod,
        }
      };
    } catch (error) {
      console.error('Error getting expense insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async deleteExpense(userId: string, expenseId: number) {
    try {
      // First check if expense exists and belongs to user
      const [expense] = await db.select().from(expenses).where(
        and(eq(expenses.id, expenseId), eq(expenses.userId, userId))
      );

      if (!expense) {
        return {
          success: false,
          error: 'Expense not found or you do not have permission to delete it'
        };
      }

      // Delete expense-tag relationships first
      await db.delete(expenseTags).where(eq(expenseTags.expenseId, expenseId));
      
      // Delete the expense
      await db.delete(expenses).where(eq(expenses.id, expenseId));

      return {
        success: true,
        deletedExpense: expense
      };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async createTag(params: CreateTagParams) {
    const { userId, tagName } = params;
    
    try {
      // Check if tag already exists
      const [existingTag] = await db.select().from(tags).where(
        and(eq(tags.userId, userId), eq(tags.tagName, tagName))
      );

      if (existingTag) {
        return {
          success: false,
          error: `Tag "${tagName}" already exists`,
          tag: existingTag
        };
      }

      const [newTag] = await db.insert(tags).values({
        userId,
        tagName,
      }).returning();

      return {
        success: true,
        tag: newTag
      };
    } catch (error) {
      console.error('Error creating tag:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
}; 