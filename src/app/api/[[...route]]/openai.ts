import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import { env } from "@/lib/env";

export const openaiRoute = new Hono()
  .get("/key", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        error: 'Unauthorized',
      }, 401);
    }

    try {
      // Check if OpenAI API key is configured
      if (!env.OPENAI_API_KEY) {
        return c.json({
          success: false,
          error: 'OpenAI API key not configured',
        }, 500);
      }

      // Return the API key (only to authenticated users)
      return c.json({
        success: true,
        apiKey: env.OPENAI_API_KEY
      });
    } catch (error) {
      console.error('Error providing OpenAI API key:', error);
      return c.json({
        success: false,
        error: 'Internal server error',
      }, 500);
    }
  }); 