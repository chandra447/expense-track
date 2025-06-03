import { drizzle } from 'drizzle-orm/libsql/http';
import { env } from '@/lib/env';
import * as schema from './schema/expenses';
import {createClient} from "@libsql/client"

const client = createClient({
    url: env.DATABASE_URL,
    authToken:env.DATABASE_AUTH_TOKEN
})

export const db = drizzle(client, { schema });

export default db;

