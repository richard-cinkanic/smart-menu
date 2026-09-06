import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  PUBLIC_APP_URL: z.string().default("http://localhost:5173"),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_MAILTO: z.string().default("mailto:admin@smartmenu.local"),
  DEMO_MODE: z.enum(["true", "false"]).transform((value) => value === "true").optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  // Production deployments are read-only unless explicitly configured otherwise.
  DEMO_MODE: parsedEnv.DEMO_MODE ?? parsedEnv.NODE_ENV === "production"
};
