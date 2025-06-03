import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getAuth } from "@hono/clerk-auth";
import { db } from "@/db";
import { chatThreads, chatMessages } from "@/db/schema/chat";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

export const threadsRoute = new Hono()
  // Get all chat threads for the authenticated user
  .get("/", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const threads = await db
        .select()
        .from(chatThreads)
        .where(eq(chatThreads.userId, auth.userId))
        .orderBy(desc(chatThreads.updatedAt));

      return c.json({
        success: true,
        threads,
        count: threads.length,
      });
    } catch (error) {
      console.error("Error fetching threads:", error);
      return c.json({
        success: false,
        message: "Failed to fetch threads",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  })

  // Create a new chat thread
  .post("/", zValidator("json", createThreadSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const { title } = c.req.valid("json");
      const threadId = nanoid();

      const newThread = await db
        .insert(chatThreads)
        .values({
          id: threadId,
          userId: auth.userId,
          title: title || "New Chat",
        })
        .returning();

      return c.json({
        success: true,
        thread: newThread[0],
        message: "Thread created successfully",
      });
    } catch (error) {
      console.error("Error creating thread:", error);
      return c.json({
        success: false,
        message: "Failed to create thread",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  })

  // Get messages for a specific thread
  .get("/:threadId/messages", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const threadId = c.req.param("threadId");

      // First verify the thread belongs to the user
      const thread = await db
        .select()
        .from(chatThreads)
        .where(and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, auth.userId)
        ))
        .limit(1);

      if (thread.length === 0) {
        return c.json({
          success: false,
          message: "Thread not found or access denied",
        }, 404);
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.threadId, threadId))
        .orderBy(chatMessages.createdAt);

      return c.json({
        success: true,
        messages,
        count: messages.length,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return c.json({
        success: false,
        message: "Failed to fetch messages",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  })

  // Add a message to a thread
  .post("/:threadId/messages", zValidator("json", createMessageSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const threadId = c.req.param("threadId");
      const { role, content } = c.req.valid("json");

      // First verify the thread belongs to the user
      const thread = await db
        .select()
        .from(chatThreads)
        .where(and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, auth.userId)
        ))
        .limit(1);

      if (thread.length === 0) {
        return c.json({
          success: false,
          message: "Thread not found or access denied",
        }, 404);
      }

      const messageId = nanoid();
      const newMessage = await db
        .insert(chatMessages)
        .values({
          id: messageId,
          threadId,
          role,
          content,
        })
        .returning();

      // Update thread's updatedAt timestamp
      await db
        .update(chatThreads)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(chatThreads.id, threadId));

      return c.json({
        success: true,
        message: newMessage[0],
      });
    } catch (error) {
      console.error("Error creating message:", error);
      return c.json({
        success: false,
        message: "Failed to create message",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  })

  // Update thread title
  .put("/:threadId", zValidator("json", z.object({ title: z.string().min(1).max(255) })), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const threadId = c.req.param("threadId");
      const { title } = c.req.valid("json");

      // First verify the thread belongs to the user
      const existingThread = await db
        .select()
        .from(chatThreads)
        .where(and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, auth.userId)
        ))
        .limit(1);

      if (existingThread.length === 0) {
        return c.json({
          success: false,
          message: "Thread not found or access denied",
        }, 404);
      }

      const updatedThread = await db
        .update(chatThreads)
        .set({ 
          title,
          updatedAt: new Date().toISOString()
        })
        .where(eq(chatThreads.id, threadId))
        .returning();

      return c.json({
        success: true,
        thread: updatedThread[0],
        message: "Thread updated successfully",
      });
    } catch (error) {
      console.error("Error updating thread:", error);
      return c.json({
        success: false,
        message: "Failed to update thread",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  })

  // Delete a thread (and all its messages due to cascade)
  .delete("/:threadId", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const threadId = c.req.param("threadId");

      // First verify the thread belongs to the user
      const thread = await db
        .select()
        .from(chatThreads)
        .where(and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, auth.userId)
        ))
        .limit(1);

      if (thread.length === 0) {
        return c.json({
          success: false,
          message: "Thread not found or access denied",
        }, 404);
      }

      await db.delete(chatThreads).where(eq(chatThreads.id, threadId));

      return c.json({
        success: true,
        message: "Thread deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting thread:", error);
      return c.json({
        success: false,
        message: "Failed to delete thread",
        error: error instanceof Error ? error.message : "Unknown error",
      }, 500);
    }
  }); 