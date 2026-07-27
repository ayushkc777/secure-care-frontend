import { describe, expect, test } from "vitest";

import {
  authTokenSchema,
  changePasswordFormSchema,
  emailFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from "./auth.schemas";

describe("registration schema", () => {
  test("accepts the required password policy without retaining confirmation", () => {
    const result = registerFormSchema.parse({
      email: " Parent@example.com ".trim(),
      password: "Meadow!Quartz7-River-Care",
      confirmPassword: "Meadow!Quartz7-River-Care",
    });

    expect(result.email).toBe("Parent@example.com");
  });

  test("rejects weak, mismatched and unknown input", () => {
    expect(
      registerFormSchema.safeParse({
        email: "parent@example.com",
        password: "weak",
        confirmPassword: "different",
        role: "ADMINISTRATOR",
      }).success,
    ).toBe(false);
  });
});

describe("account recovery schemas", () => {
  test("validates email and opaque link tokens", () => {
    expect(emailFormSchema.safeParse({ email: "parent@example.com" }).success).toBe(true);
    expect(authTokenSchema.safeParse("a".repeat(32)).success).toBe(true);
    expect(authTokenSchema.safeParse("short").success).toBe(false);
  });

  test("requires strong matching reset passwords", () => {
    expect(
      resetPasswordFormSchema.safeParse({
        newPassword: "Meadow!Quartz7-River-Care",
        confirmPassword: "Meadow!Quartz7-River-Care",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordFormSchema.safeParse({
        newPassword: "Meadow!Quartz7-River-Care",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  test("requires the current password for an authenticated change", () => {
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: "",
        newPassword: "Meadow!Quartz7-River-Care",
        confirmPassword: "Meadow!Quartz7-River-Care",
      }).success,
    ).toBe(false);
  });
});
