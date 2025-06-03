import { drizzle } from 'drizzle-orm/libsql/http';
import { env } from '@/lib/env';
import * as expensesSchema from './schema/expenses';
import * as creditsSchema from './schema/credits';
import * as chatSchema from './schema/chat';
import {createClient} from "@libsql/client"

const client = createClient({
    url: env.DATABASE_URL,
    authToken:env.DATABASE_AUTH_TOKEN
})

// Combine all schemas
const schema = {
  ...expensesSchema,
  ...creditsSchema,
  ...chatSchema,
};

export const db = drizzle(client, { schema });

export default db;

