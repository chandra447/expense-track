import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import db from "@/db";
import { tags } from "@/db/schema/expenses";
import { createTagSchema } from "@/db/types/db_types";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@hono/clerk-auth";

export const tagRoute = new Hono()
  .get("/", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      // Get all tags for the authenticated user
      const userTags = await db.query.tags.findMany({
        where: eq(tags.userId, auth.userId),
        orderBy: (tags, { asc }) => [asc(tags.tagName)]
      });

      return c.json({
        success: true,
        tags: userTags,
        count: userTags.length,
      });
    } catch (error) {
      console.error("Error fetching tags:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch tags",
        },
        500
      );
    }
  })

  .post("/", zValidator("json", createTagSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const { tagName } = c.req.valid("json");

      // Check if tag already exists for this user
      const existingTag = await db.query.tags.findFirst({
        where: (tags, { and, eq }) => and(
          eq(tags.userId, auth.userId),
          eq(tags.tagName, tagName)
        )
      });

      if (existingTag) {
        return c.json(
          {
            success: false,
            error: "Tag already exists",
          },
          409
        );
      }

      // Create new tag
      const [newTag] = await db
        .insert(tags)
        .values({
          tagName,
          userId: auth.userId,
        })
        .returning();

      return c.json(
        {
          success: true,
          message: "Tag created successfully",
          tag: newTag,
        },
        201
      );
    } catch (error) {
      console.error("Error creating tag:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create tag",
        },
        500
      );
    }
  })

  .put("/:id", zValidator("json", createTagSchema), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const tagId = parseInt(c.req.param("id"));
      const { tagName } = c.req.valid("json");

      if (isNaN(tagId)) {
        return c.json(
          {
            success: false,
            error: "Invalid tag ID",
          },
          400
        );
      }

      // Check if tag exists and belongs to user
      const existingTag = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.userId, auth.userId))
      });

      if (!existingTag) {
        return c.json(
          {
            success: false,
            error: "Tag not found or you don't have permission to edit it",
          },
          404
        );
      }

      // Check if new tag name already exists for this user (excluding current tag)
      const duplicateTag = await db.query.tags.findFirst({
        where: (tags, { and, eq, ne }) => and(
          eq(tags.userId, auth.userId),
          eq(tags.tagName, tagName),
          ne(tags.id, tagId)
        )
      });

      if (duplicateTag) {
        return c.json(
          {
            success: false,
            error: "Tag name already exists",
          },
          409
        );
      }

      // Update tag
      const [updatedTag] = await db
        .update(tags)
        .set({ tagName })
        .where(and(eq(tags.id, tagId), eq(tags.userId, auth.userId)))
        .returning();

      return c.json(
        {
          success: true,
          message: "Tag updated successfully",
          tag: updatedTag,
        },
        200
      );
    } catch (error) {
      console.error("Error updating tag:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update tag",
        },
        500
      );
    }
  })

  .delete("/:id", async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401)
    }

    try {
      const tagId = parseInt(c.req.param("id"));

      if (isNaN(tagId)) {
        return c.json(
          {
            success: false,
            error: "Invalid tag ID",
          },
          400
        );
      }

      // Check if tag exists and belongs to user
      const existingTag = await db.query.tags.findFirst({
        where: and(eq(tags.id, tagId), eq(tags.userId, auth.userId))
      });

      if (!existingTag) {
        return c.json(
          {
            success: false,
            error: "Tag not found or you don't have permission to delete it",
          },
          404
        );
      }

      // Delete the tag (this will also remove it from expense_tags due to foreign key constraints)
      await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, auth.userId)));

      return c.json(
        {
          success: true,
          message: "Tag deleted successfully",
        },
        200
      );
    } catch (error) {
      console.error("Error deleting tag:", error);
      return c.json(
        {
          success: false,
          error: "Failed to delete tag",
        },
        500
      );
    }
  }); 