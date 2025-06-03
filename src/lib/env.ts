import {z} from "zod";

const dataBaseConnection = z.object({
    DATABASE_URL: z.string().url(),
    DATABASE_AUTH_TOKEN: z.string().nonempty()
})

const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN
}

const _env = dataBaseConnection.safeParse(processEnv);

if (!_env.success){
    console.error("Invalid environemnt variables:",_env.error.format());
    console.log(process.env.DATABASE_URL);
    console.log(process.env.DATABASE_AUTH_TOKEN)
    throw new Error("Invalid Environemnt variables");
}

export const env = _env.data;

