import { env } from "@/lib/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: 'turso', 
    schema: './src/db/schema',
    out:"./drizzle",
    dbCredentials:{
        url:env.DATABASE_URL,
        authToken: env.DATABASE_AUTH_TOKEN
    }
  })
