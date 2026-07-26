import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const registerFormSchema = z
  .object({
    email: z.email("Enter a valid email address.").max(254),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use no more than 128 characters.")
      .regex(/[a-z]/u, "Add a lowercase letter.")
      .regex(/[A-Z]/u, "Add an uppercase letter.")
      .regex(/\d/u, "Add a number.")
      .regex(/[^A-Za-z0-9]/u, "Add a special character."),
    confirmPassword: z.string(),
  })
  .strict()
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
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
export type RegisterForm = z.infer<typeof registerFormSchema>;
export type TotpForm = z.infer<typeof totpFormSchema>;
export type RecoveryForm = z.infer<typeof recoveryFormSchema>;
export type StepUpForm = z.infer<typeof stepUpFormSchema>;
