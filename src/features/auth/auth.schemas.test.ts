import { describe, expect, test } from "vitest";

import { registerFormSchema } from "./auth.schemas";

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
