export type RoleAssignment = {
  id: string;
  userId: string;
  roleCode: "ADMINISTRATOR" | "CENTRE_MANAGER" | "EDUCATOR" | "PARENT" | "SECURITY_AUDITOR";
  centreId: string | null;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  validFrom: string;
  validUntil: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};
