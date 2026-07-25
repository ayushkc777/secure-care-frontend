import { z } from "zod";

import type { CurrentAccess } from "./access.types";

export const centreRoleCodes = [
  "CENTRE_MANAGER",
  "EDUCATOR",
  "PARENT",
  "SECURITY_AUDITOR",
] as const;

export type CentreRoleCode = (typeof centreRoleCodes)[number];

export function centreRoleOptions(access: CurrentAccess): readonly CentreRoleCode[] {
  return access.platformPermissions.includes("role_assignment.manage")
    ? centreRoleCodes
    : ["EDUCATOR", "PARENT"];
}

export function roleAssignmentFormSchema(permittedRoles: readonly CentreRoleCode[]) {
  return z
    .object({
      userId: z.uuid("Enter a valid user identifier."),
      roleCode: z.enum(centreRoleCodes),
    })
    .strict()
    .refine((value) => permittedRoles.includes(value.roleCode), {
      message: "That role cannot be assigned with your current access.",
      path: ["roleCode"],
    });
}

export const administratorAssignmentFormSchema = z
  .object({
    userId: z.uuid("Enter a valid user identifier."),
  })
  .strict();

export const childAccessFormSchema = z
  .object({
    centreId: z.uuid("Enter a valid centre identifier."),
    childId: z.uuid("Enter a valid child identifier."),
    action: z.enum(["child.read", "incident.read", "pickup_authorisation.manage"]),
  })
  .strict();

export type RoleAssignmentForm = {
  userId: string;
  roleCode: CentreRoleCode;
};

export type AdministratorAssignmentForm = z.infer<typeof administratorAssignmentFormSchema>;
export type ChildAccessForm = z.infer<typeof childAccessFormSchema>;
