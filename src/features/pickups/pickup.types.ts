import type { CurrentAccess } from "../access/access.types";

export type PickupAuthorisationStatus = "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "USED";

export type PickupAuthorisation = {
  id: string;
  centreId: string;
  childId: string;
  pickupPerson: {
    id: string;
    displayName: string | null;
    relationshipLabel: string | null;
    phone?: string | null;
  };
  isRecurring: boolean;
  restrictions?: string | null;
  status: PickupAuthorisationStatus;
  validFrom: string;
  validUntil: string | null;
  hasActiveCode: boolean;
  codeExpiresAt: string | null;
  version: number;
};

export type PickupHistoryEntry = {
  id: string;
  centreId: string;
  childId: string;
  pickupAuthorizationId: string;
  result: "VERIFIED" | "DENIED" | "OVERRIDDEN";
  occurredAt: string;
  completedByUserId?: string;
};

export type PickupVerification = {
  verificationId: string;
  expiresAt: string;
  pickupPerson: {
    id: string;
    displayName: string | null;
    phone: string | null;
  };
};

export type PickupControls = {
  canCreate: boolean;
  canUpdate: boolean;
  canRevoke: boolean;
  canVerify: boolean;
  canComplete: boolean;
  canOverride: boolean;
};

export function pickupControls(access: CurrentAccess, centreId: string): PickupControls {
  const permissions = new Set([
    ...access.platformPermissions,
    ...(access.centres.find((centre) => centre.centreId === centreId)?.permissions ?? []),
  ]);
  return {
    canCreate: permissions.has("pickup_authorisation.create"),
    canUpdate: permissions.has("pickup_authorisation.update"),
    canRevoke: permissions.has("pickup_authorisation.revoke"),
    canVerify: permissions.has("pickup_verification.perform"),
    canComplete: permissions.has("pickup_completion.create"),
    canOverride: permissions.has("pickup_verification.override"),
  };
}
