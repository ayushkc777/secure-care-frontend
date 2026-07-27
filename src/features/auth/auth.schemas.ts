import { z } from "zod";

const emailSchema = z.email("Enter a valid email address.").max(254);
const strongPasswordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/u, "Add a lowercase letter.")
  .regex(/[A-Z]/u, "Add an uppercase letter.")
  .regex(/\d/u, "Add a number.")
  .regex(/[^A-Za-z0-9]/u, "Add a special character.");

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const registerFormSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const emailFormSchema = z.object({ email: emailSchema }).strict();

export const authTokenSchema = z.string().min(32).max(512);

export const resetPasswordFormSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine(({ confirmPassword, newPassword }) => confirmPassword === newPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine(({ confirmPassword, newPassword }) => confirmPassword === newPassword, {
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
export type EmailForm = z.infer<typeof emailFormSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;
export type TotpForm = z.infer<typeof totpFormSchema>;
export type RecoveryForm = z.infer<typeof recoveryFormSchema>;
export type StepUpForm = z.infer<typeof stepUpFormSchema>;
