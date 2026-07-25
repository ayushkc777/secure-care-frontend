import { describe, expect, test } from "vitest";

import {
  administratorAssignmentFormSchema,
  centreRoleOptions,
  roleAssignmentFormSchema,
} from "./role-assignment.schemas";
import type { CurrentAccess } from "./access.types";

const userId = "17d3be6d-7969-4f75-8260-9e45af0871a7";

function access(platformManage: boolean): CurrentAccess {
  return {
    userId,
    authenticationState: "MFA_AUTHENTICATED",
    platformPermissions: platformManage ? ["role_assignment.manage"] : [],
    centres: [],
    assignments: [],
  };
}

describe("role assignment form validation", () => {
  test("limits centre managers to educator and parent roles", () => {
    const options = centreRoleOptions(access(false));
    const schema = roleAssignmentFormSchema(options);

    expect(schema.safeParse({ userId, roleCode: "EDUCATOR" }).success).toBe(true);
    expect(schema.safeParse({ userId, roleCode: "PARENT" }).success).toBe(true);
    expect(schema.safeParse({ userId, roleCode: "CENTRE_MANAGER" }).success).toBe(false);
    expect(schema.safeParse({ userId, roleCode: "SECURITY_AUDITOR" }).success).toBe(false);
  });

  test("allows administrators to choose every supported centre role", () => {
    const options = centreRoleOptions(access(true));
    const schema = roleAssignmentFormSchema(options);

    for (const roleCode of options) {
      expect(schema.safeParse({ userId, roleCode }).success).toBe(true);
    }
  });

  test("keeps platform administrator input minimal and strict", () => {
    expect(administratorAssignmentFormSchema.safeParse({ userId }).success).toBe(true);
    expect(
      administratorAssignmentFormSchema.safeParse({
        userId,
        centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
      }).success,
    ).toBe(false);
  });
});
