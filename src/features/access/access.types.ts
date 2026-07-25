export const Permission = {
  AccountManageSelf: "account.manage_self",
  RoleAssignmentRead: "role_assignment.read",
  RoleAssignmentManage: "role_assignment.manage",
  ChildRead: "child.read",
  IncidentRead: "incident.read",
  PickupAuthorisationManage: "pickup_authorisation.manage",
  AuditRead: "audit.read",
  SecurityAlertRead: "security_alert.read",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export type AccessAssignment = {
  id: string;
  roleCode: "ADMINISTRATOR" | "CENTRE_MANAGER" | "EDUCATOR" | "PARENT" | "SECURITY_AUDITOR";
  scope: "PLATFORM" | "CENTRE";
  centreId: string | null;
};

export type CurrentAccess = {
  userId: string;
  authenticationState: "MFA_AUTHENTICATED";
  platformPermissions: Permission[];
  centres: {
    centreId: string;
    permissions: Permission[];
  }[];
  assignments: AccessAssignment[];
};

export type AccessState =
  | { status: "loading"; access: null }
  | { status: "unauthenticated"; access: null }
  | { status: "restricted"; access: null }
  | { status: "error"; access: null }
  | { status: "ready"; access: CurrentAccess };
