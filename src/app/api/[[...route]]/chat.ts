import { Hono } from "hono";
import { z } from "zod";
import { getAuth } from "@hono/clerk-auth";
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { expenseFunctions } from '@/lib/expense-functions';

export const chatRoute = new Hono()
  .post("/",  async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({
        success: false,
        message: 'You are not logged in.',
      }, 401);
    }

    try {
      const { messages } = await c.req.json()

      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: `You are a helpful AI assistant for expense tracking. You can help users:
- Create new expenses with natural language
- Get expense summaries and insights
- Search and filter expenses
- Manage expense tags
- Delete expenses (with confirmation)

Always be helpful and provide clear, concise responses. When creating expenses, try to extract meaningful information from user input like amount, description, and potential tags.

IMPORTANT: Only specify a date when the user explicitly mentions a specific date. If no date is mentioned, let the system use the current timestamp automatically.

TAG MANAGEMENT: 
- When creating expenses with tags, the system will automatically check if each tag exists and use the existing tag, or create a new one if it doesn't exist. You don't need to manually check for existing tags when creating expenses.
- Before creating standalone tags (using create_tag tool), ALWAYS check if a similar tag already exists by using the get_all_tags tool. If a tag with the same or similar name exists, inform the user about the existing tag instead of creating a duplicate.
- This helps maintain a clean and organized tag system without duplicates.`,
        messages,
        tools: {
          create_expense: tool({
            description: 'Create a new expense entry. Tags will be automatically handled - existing tags will be used, and new tags will be created if they don\'t exist.',
            parameters: z.object({
              title: z.string().describe('The expense title/description'),
              amount: z.number().describe('The expense amount in dollars'),
              tagNames: z.array(z.string()).optional().describe('Optional array of tag names to associate with the expense. Existing tags will be used, new ones will be created automatically.'),
              date: z.string().optional().describe('Optional date in ISO format, only use when user explicitly mentions a specific date'),
            }),
            execute: async ({ title, amount, tagNames = [], date }) => {
              const result = await expenseFunctions.createExpenseWithTags({
                userId: auth.userId,
                title,
                amount: Math.round(amount * 100), // Convert to cents
                tagNames,
                // Only pass date if explicitly provided, otherwise let DB use CURRENT_TIMESTAMP
                ...(date && { date }),
              });

              if (result.success && result.expense) {
                return {
                  success: true,
                  message: `Successfully created expense "${title}" for $${amount.toFixed(2)}${tagNames.length > 0 ? ` with tags: ${tagNames.join(', ')}` : ''}`,
                  expense: {
                    id: result.expense.id,
                    title: result.expense.title,
                    amount: result.expense.amount / 100,
                    tags: result.expense.tags,
                    date: result.expense.createdAt,
                  }
                };
              } else {
                return {
                  success: false,
                  message: 'Failed to create expense. Please try again.',
                  error: result.error
                };
              }
            },
          }),
          get_all_tags: tool({
            description: 'Get all existing tags for the user',
            parameters: z.object({}),
            execute: async () => {
              const result = await expenseFunctions.getAllTags(auth.userId);

              if (result.success && result.tags) {
                return {
                  success: true,
                  tags: result.tags.map(tag => ({
                    id: tag.id,
                    name: tag.tagName,
                    createdAt: tag.createdAt,
                  })),
                  message: `Found ${result.tags.length} existing tags.`
                };
              } else {
                return {
                  success: false,
                  message: 'Failed to get tags. Please try again.',
                  error: result.error
                };
              }
            },
          }),
          get_expense_summary: tool({
            description: 'Get a summary of all expenses',
            parameters: z.object({}),
            execute: async () => {
              const result = await expenseFunctions.getExpensesSummary(auth.userId);

              if (result.success && result.summary) {
                const totalAmount = result.summary.totalAmount / 100;
                const averageAmount = result.summary.count > 0 ? totalAmount / result.summary.count : 0;

                return {
                  success: true,
                  summary: {
                    totalExpenses: totalAmount,
                    numberOfExpenses: result.summary.count,
                    averageExpense: averageAmount,
                    recentExpenses: result.summary.recentExpenses.map(exp => ({
                      id: exp.id,
                      title: exp.title,
                      amount: exp.amount / 100,
                      date: exp.createdAt,
                    }))
                  },
                  message: `You have ${result.summary.count} expenses totaling $${totalAmount.toFixed(2)}. Average expense: $${averageAmount.toFixed(2)}.`
                };
              } else {
                return {
                  success: false,
                  message: 'Failed to get expense summary. Please try again.',
                  error: result.error
                };
              }
            },
          }),
          search_expenses: tool({
            description: 'Search and filter expenses',
            parameters: z.object({
              query: z.string().optional().describe('Search query for expense titles'),
              minAmount: z.number().optional().describe('Minimum amount filter'),
              maxAmount: z.number().optional().describe('Maximum amount filter'),
              tagName: z.string().optional().describe('Filter by tag name'),
              limit: z.number().optional().describe('Maximum number of results to return'),
            }),
            execute: async ({ query, minAmount, maxAmount, tagName, limit = 10 }) => {
              const result = await expenseFunctions.searchExpenses({
                userId: auth.userId,
                query,
                minAmount,
                maxAmount,
                tagName,
                limit,
              });

              if (result.success && result.results) {
                const formattedResults = result.results.map(exp => ({
                  id: exp.id,
                  title: exp.title,
                  amount: exp.amount / 100,
                  date: exp.createdAt,
                }));

                return {
                  success: true,
                  results: formattedResults,
                  count: result.count,
                  message: `Found ${result.count} expenses matching your criteria.`
                };
              } else {
                return {
                  success: false,
                  message: 'Failed to search expenses. Please try again.',
                  error: result.error
                };
              }
            },
          }),
          create_tag: tool({
            description: 'Create a new expense tag',
            parameters: z.object({
              tagName: z.string().describe('The name of the tag to create'),
            }),
            execute: async ({ tagName }) => {
              const result = await expenseFunctions.createTag({
                userId: auth.userId,
                tagName,
              });

              if (result.success && result.tag) {
                return {
                  success: true,
                  message: `Successfully created tag "${tagName}".`,
                  tag: {
                    id: result.tag.id,
                    name: result.tag.tagName,
                  }
                };
              } else {
                // If tag already exists, provide helpful message
                if (result.error && result.error.includes('already exists')) {
                  return {
                    success: false,
                    message: `Tag "${tagName}" already exists. You can use the existing tag when creating expenses.`,
                    existingTag: result.tag ? {
                      id: result.tag.id,
                      name: result.tag.tagName,
                    } : null
                  };
                }
                return {
                  success: false,
                  message: result.error || 'Failed to create tag. Please try again.',
                };
              }
            },
          }),
          get_expense_insights: tool({
            description: 'Get financial insights and analytics',
            parameters: z.object({
              period: z.enum(['week', 'month', 'year']).optional().describe('Time period for insights'),
            }),
            execute: async ({ period = 'month' }) => {
              const result = await expenseFunctions.getExpenseInsights(auth.userId, period);

              if (result.success && result.insights) {
                const totalAmount = result.insights.totalAmount / 100;
                const averageAmount = result.insights.averageAmount / 100;
                const dailyAverage = result.insights.dailyAverage / 100;

                return {
                  success: true,
                  insights: {
                    period: result.insights.period,
                    totalExpenses: totalAmount,
                    numberOfExpenses: result.insights.numberOfExpenses,
                    averageExpense: averageAmount,
                    dailyAverage,
                    daysInPeriod: result.insights.daysInPeriod,
                  },
                  message: `In the last ${period}, you spent $${totalAmount.toFixed(2)} across ${result.insights.numberOfExpenses} expenses. Daily average: $${dailyAverage.toFixed(2)}.`
                };
              } else {
                return {
                  success: false,
                  message: 'Failed to get expense insights. Please try again.',
                  error: result.error
                };
              }
            },
          }),
          delete_expense: tool({
            description: 'Delete an expense by ID (requires confirmation)',
            parameters: z.object({
              expenseId: z.number().describe('The ID of the expense to delete'),
            }),
            execute: async ({ expenseId }) => {
              const result = await expenseFunctions.deleteExpense(auth.userId, expenseId);

              if (result.success && result.deletedExpense) {
                return {
                  success: true,
                  message: `Successfully deleted expense "${result.deletedExpense.title}" ($${(result.deletedExpense.amount / 100).toFixed(2)}).`,
                  deletedExpense: {
                    id: result.deletedExpense.id,
                    title: result.deletedExpense.title,
                    amount: result.deletedExpense.amount / 100,
                  }
                };
              } else {
                return {
                  success: false,
                  message: result.error || 'Failed to delete expense. Please try again.',
                };
              }
            },
          }),
        },
        onFinish: async ({ response }) => {
          console.log('Chat completed:', response.messages.length, 'messages');
        },
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error('Chat API error:', error);
      return c.json({
        success: false,
        error: 'Internal Server Error'
      }, 500);
    }
  });