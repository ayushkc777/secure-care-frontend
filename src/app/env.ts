import { z } from "zod";

const environmentSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default("/api/v1"),
  VITE_APP_NAME: z.string().min(1).default("SecureCare"),
  VITE_APP_VERSION: z.string().min(1).default("0.2.0"),
});

const result = environmentSchema.safeParse(import.meta.env);

if (!result.success) {
  throw new Error("Invalid public frontend environment configuration.");
}

export const env = Object.freeze(result.data);
