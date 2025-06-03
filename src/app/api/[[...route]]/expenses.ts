import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/db";
import { expenses } from "@/db/schema/expenses";
import {
  createExpenseWithTagsSchema,
  getExpenseByIdSchema,
  updateExpenseSchema,
} from "@/db/types/db_types";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@hono/clerk-auth";

export const expenseRoute = new Hono()
  .get("/", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      // Filter expenses by the authenticated user's ID
      const expensesWithTags = await db.query.expenses.findMany({
        where: eq(expenses.userId, auth.userId),
        with: {
          expenseTags: {
            with: {
              tag: true
            }
          }
        },
        orderBy: (expenses, { desc }) => [desc(expenses.createdAt)]
      })
      
      const flattened = expensesWithTags.map(expense => {
        return {
          ...expense,
          expenseTags: expense.expenseTags.map(tags => {
            return { id: tags.tag.id, name: tags.tag.tagName }
          })
        }
      });
    
      return c.json({
        success: true,
        expenses: flattened,
        count: flattened.length,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch expenses",
        },
        500
      );
    }
  })

  .get("/:id{[0-9]+}", zValidator("param", getExpenseByIdSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const { id } = c.req.valid("param");

      // Ensure user can only access their own expenses
      const expenseById = await db.query.expenses.findFirst({
        where: and(eq(expenses.id, id), eq(expenses.userId, auth.userId)),
        with: {
          expenseTags: {
            with: {
              tag: true,
            },
          },
        },
      });
     
      if (!expenseById) {
        return c.json(
          {
            success: false,
            error: "Expense not found or you don't have permission to access it",
          },
          404
        );
      }
      
      const flattened = {
        ...expenseById,
        expenseTags: expenseById.expenseTags.map(tags => {
          return { id: tags.tag.id, name: tags.tag.tagName }
        })
      }

      return c.json({
        success: true,
        expense: flattened,
      });
    } catch (error) {
      console.error("Error fetching expense:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch expense",
        },
        500
      );
    }
  })

  .post("/", zValidator("json", createExpenseWithTagsSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const { title, amount, tagIds, createdAt } = c.req.valid("json");

      // Use the authenticated user's ID instead of accepting it from the request
      const expenseData: any = {
        title,
        amount, 
        userId: auth.userId, // Use authenticated user's ID
      };

      // If custom date is provided, use it; otherwise let DB set current timestamp
      if (createdAt) {
        expenseData.createdAt = new Date(createdAt);
      }

      const [newExpense] = await db
        .insert(expenses)
        .values(expenseData)
        .returning();

      // Link tags if provided
      if (tagIds && tagIds.length > 0) {
        const { expenseTags } = await import("@/db/schema/expenses");
        await db.insert(expenseTags).values(
          tagIds.map((tagId) => ({
            expenseId: newExpense.id,
            tagId,
          }))
        );
      }

      // Fetch the complete expense with relations
      const completeExpense = await db.query.expenses.findFirst({
        where: eq(expenses.id, newExpense.id),
        with: {
          expenseTags: {
            with: {
              tag: true,
            },
          },
        },
      });

      return c.json(
        {
          success: true,
          message: "Expense created successfully",
          expense: completeExpense,
        },
        201
      );
    } catch (error) {
      console.error("Error creating expense:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create expense",
        },
        500
      );
    }
  })

  .put("/:id{[0-9]+}", zValidator("param", getExpenseByIdSchema), zValidator("json", createExpenseWithTagsSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const { id } = c.req.valid("param");
      const { title, amount, tagIds, createdAt } = c.req.valid("json");

      // Check if expense exists and belongs to user
      const existingExpense = await db.query.expenses.findFirst({
        where: and(eq(expenses.id, id), eq(expenses.userId, auth.userId)),
      });

      if (!existingExpense) {
        return c.json(
          {
            success: false,
            error: "Expense not found or you don't have permission to update it",
          },
          404
        );
      }

      // Update the expense
      const updateData: any = {
        title,
        amount,
      };

      // If custom date is provided, update it
      if (createdAt) {
        updateData.createdAt = new Date(createdAt);
      }

      await db
        .update(expenses)
        .set(updateData)
        .where(eq(expenses.id, id));

      // Update tags - first delete existing tags, then insert new ones
      const { expenseTags } = await import("@/db/schema/expenses");
      await db.delete(expenseTags).where(eq(expenseTags.expenseId, id));

      if (tagIds && tagIds.length > 0) {
        await db.insert(expenseTags).values(
          tagIds.map((tagId) => ({
            expenseId: id,
            tagId,
          }))
        );
      }

      // Fetch the updated expense with relations
      const updatedExpense = await db.query.expenses.findFirst({
        where: eq(expenses.id, id),
        with: {
          expenseTags: {
            with: {
              tag: true,
            },
          },
        },
      });

      return c.json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      });
    } catch (error) {
      console.error("Error updating expense:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update expense",
        },
        500
      );
    }
  })

  .delete("/:id{[0-9]+}", zValidator("param", getExpenseByIdSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const { id } = c.req.valid("param");

      // Check if expense exists and belongs to user
      const existingExpense = await db.query.expenses.findFirst({
        where: and(eq(expenses.id, id), eq(expenses.userId, auth.userId)),
      });

      if (!existingExpense) {
        return c.json(
          {
            success: false,
            error: "Expense not found or you don't have permission to delete it",
          },
          404
        );
      }

      // Delete associated expense tags first (foreign key constraint)
      const { expenseTags } = await import("@/db/schema/expenses");
      await db.delete(expenseTags).where(eq(expenseTags.expenseId, id));

      // Delete the expense
      await db.delete(expenses).where(eq(expenses.id, id));

      return c.json({
        success: true,
        message: "Expense deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      return c.json(
        {
          success: false,
          error: "Failed to delete expense",
        },
        500
      );
    }
  })

  // Add a protected route to get current user info
  .get("/me", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      // Get Clerk client to fetch user details
      const clerkClient = c.get('clerk');
      const user = await clerkClient.users.getUser(auth.userId);

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch user information",
        },
        500
      );
    }
  });
