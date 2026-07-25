import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const totpFormSchema = z.object({
  code: z.string().regex(/^\d{6}$/u, "Enter the six-digit code."),
});

export const recoveryFormSchema = z.object({
  recoveryCode: z.string().min(16, "Enter a complete recovery code.").max(64),
});

export const stepUpFormSchema = z.object({
  password: z.string().min(1, "Enter your current password.").max(128),
  method: z.enum(["totp", "recovery"]),
  code: z.string().min(6, "Enter your verification code.").max(64),
});

export type LoginForm = z.infer<typeof loginFormSchema>;
export type TotpForm = z.infer<typeof totpFormSchema>;
export type RecoveryForm = z.infer<typeof recoveryFormSchema>;
export type StepUpForm = z.infer<typeof stepUpFormSchema>;
