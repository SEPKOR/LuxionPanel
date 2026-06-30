import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(64),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  language: string;
  theme: string;
  animations: boolean;
  compactMode: boolean;
  weatherLocation: string;
  modulePreferences: string | null;
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  isDefault: boolean;
  maskedKey: string;
}
