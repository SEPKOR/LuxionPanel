import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(12).default("local-development-secret-change-me"),
  LUXION_APP_NAME: z.string().default("Luxion OS"),
  LUXION_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  LUXION_ENCRYPTION_KEY: z.string().min(32).default("local-dev-key-change-me-in-prod!!"),
  LUXION_STORAGE_PATH: z.string().default("./storage"),
  LUXION_BACKUP_PATH: z.string().default("./backups"),
  LUXION_UPLOAD_MAX_MB: z.coerce.number().positive().max(512).default(25),
  LUXION_RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60_000),
  LUXION_RATE_LIMIT_MAX: z.coerce.number().positive().default(120),
  LUXION_DOCKER_ENABLED: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  LUXION_PING_TARGETS: z.string().default("https://cloudflare.com,https://github.com"),
  LUXION_OLLAMA_URL: z.string().url().default("http://localhost:11434"),
  LUXION_OLLAMA_MODEL: z.string().default("llama3.1"),
  OPENAI_COMPATIBLE_BASE_URL: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),
  NEXT_PUBLIC_LUXION_DISABLED_MODULES: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);

export function getDisabledModules() {
  return new Set(
    env.NEXT_PUBLIC_LUXION_DISABLED_MODULES.split(",")
      .map((moduleId) => moduleId.trim())
      .filter(Boolean),
  );
}

export const pingTargets = env.LUXION_PING_TARGETS.split(",")
  .map((target) => target.trim())
  .filter(Boolean);
