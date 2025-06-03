import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import { db } from "@/db";
import { userCredits, creditTransactions } from "@/db/schema/credits";
import { eq, sql } from "drizzle-orm";

export const creditsRoute = new Hono()
  .get("/", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      // Get or create user credits
      let userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, auth.userId),
      });

      if (!userCredit) {
        // Create default credits for new user
        const [newUserCredit] = await db
          .insert(userCredits)
          .values({
            userId: auth.userId,
            functionCallsUsed: 0,
            messagesUsed: 0,
            functionCallsLimit: 10,
            messagesLimit: 10,
            isPremium: 0,
          })
          .returning();
        
        userCredit = newUserCredit;
      }

      // Check if we need to reset daily limits (24 hours)
      const lastReset = new Date(userCredit.lastResetDate);
      const now = new Date();
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        // Reset daily limits
        await db
          .update(userCredits)
          .set({
            functionCallsUsed: 0,
            messagesUsed: 0,
            lastResetDate: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(userCredits.userId, auth.userId));

        // Log the reset
        await db.insert(creditTransactions).values({
          userId: auth.userId,
          type: 'reset',
          amount: 0,
          description: 'Daily credit reset',
        });

        // Refresh the user credit data
        userCredit = await db.query.userCredits.findFirst({
          where: eq(userCredits.userId, auth.userId),
        });
      }

      return c.json({
        success: true,
        credits: {
          ...userCredit,
          isPremium: Boolean(userCredit?.isPremium),
          functionCallsRemaining: (userCredit?.functionCallsLimit || 0) - (userCredit?.functionCallsUsed || 0),
          messagesRemaining: (userCredit?.messagesLimit || 0) - (userCredit?.messagesUsed || 0),
        },
      });
    } catch (error) {
      console.error("Error fetching user credits:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch user credits",
        },
        500
      );
    }
  })

  .post("/consume", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const { type, description } = await c.req.json();
      
      if (!type || !['function_call', 'message'].includes(type)) {
        return c.json({
          success: false,
          error: 'Invalid credit type. Must be "function_call" or "message"',
        }, 400);
      }

      // Get current credits
      const userCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, auth.userId),
      });

      if (!userCredit) {
        return c.json({
          success: false,
          error: 'User credits not found',
        }, 404);
      }

      // Check if user has enough credits
      const hasEnoughCredits = type === 'function_call' 
        ? userCredit.functionCallsUsed < userCredit.functionCallsLimit
        : userCredit.messagesUsed < userCredit.messagesLimit;

      if (!hasEnoughCredits) {
        return c.json({
          success: false,
          error: `Insufficient ${type.replace('_', ' ')} credits. Daily limit reached.`,
          creditsRemaining: type === 'function_call' 
            ? userCredit.functionCallsLimit - userCredit.functionCallsUsed
            : userCredit.messagesLimit - userCredit.messagesUsed,
        }, 429);
      }

      // Consume credit
      const updateField = type === 'function_call' ? 'functionCallsUsed' : 'messagesUsed';
      await db
        .update(userCredits)
        .set({
          [updateField]: sql`${userCredits[updateField]} + 1`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(userCredits.userId, auth.userId));

      // Log the transaction
      await db.insert(creditTransactions).values({
        userId: auth.userId,
        type,
        amount: 1,
        description: description || `${type.replace('_', ' ')} consumed`,
      });

      // Get updated credits
      const updatedCredit = await db.query.userCredits.findFirst({
        where: eq(userCredits.userId, auth.userId),
      });

      return c.json({
        success: true,
        message: `${type.replace('_', ' ')} credit consumed`,
        credits: {
          ...updatedCredit,
          isPremium: Boolean(updatedCredit?.isPremium),
          functionCallsRemaining: (updatedCredit?.functionCallsLimit || 0) - (updatedCredit?.functionCallsUsed || 0),
          messagesRemaining: (updatedCredit?.messagesLimit || 0) - (updatedCredit?.messagesUsed || 0),
        },
      });
    } catch (error) {
      console.error("Error consuming credits:", error);
      return c.json(
        {
          success: false,
          error: "Failed to consume credits",
        },
        500
      );
    }
  })

  .get("/transactions", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const transactions = await db.query.creditTransactions.findMany({
        where: eq(creditTransactions.userId, auth.userId),
        orderBy: (creditTransactions, { desc }) => [desc(creditTransactions.createdAt)],
        limit: 50,
      });

      return c.json({
        success: true,
        transactions,
      });
    } catch (error) {
      console.error("Error fetching credit transactions:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch credit transactions",
        },
        500
      );
    }
  }); 