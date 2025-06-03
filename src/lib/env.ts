import {z} from "zod";

const dataBaseConnection = z.object({
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().nonempty()
})

// Optional OpenAI configuration for AI features
const openAIConfig = z.object({
    OPENAI_API_KEY: z.string().optional()
})

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
}

const _env = dataBaseConnection.safeParse(processEnv);

if (!_env.success){
    console.error("Invalid environemnt variables:",_env.error.format());
    console.log(process.env.DATABASE_URL);
    console.log(process.env.DATABASE_AUTH_TOKEN)
    throw new Error("Invalid Environemnt variables");
}

// Parse OpenAI config separately (optional)
const _openAIEnv = openAIConfig.safeParse(processEnv);

export const env = {
    ..._env.data,
    OPENAI_API_KEY: _openAIEnv.success ? _openAIEnv.data.OPENAI_API_KEY : undefined
};

