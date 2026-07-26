import { hasPermission } from "../access/access-policy";
import type { CurrentAccess } from "../access/access.types";

export const allergySeverities = ["NONE", "MILD", "MODERATE", "SEVERE", "ANAPHYLAXIS"] as const;
export const medicationOutcomes = [
  "ADMINISTERED",
  "REFUSED",
  "MISSED",
  "WITHHELD",
  "NOT_AVAILABLE",
  "ERROR_RECORDED",
] as const;

export type HealthProfile = {
  id: string;
  centreId: string;
  childId?: string;
  allergySeverity: (typeof allergySeverities)[number];
  hasActiveHealthAlert: boolean;
  version: number;
  updatedAt: string;
  allergies?: string | null;
  allergyTriggers?: string | null;
  emergencyInstructions?: string | null;
  dietaryRestrictions?: string | null;
  medicalConditions?: string | null;
  healthAlert?: string | null;
};

export type HealthAmendment = {
  id: string;
  type: string;
  previousVersion: number;
  createdAt: string;
  reason?: string | null;
  correctedContent?: string | null;
};

export type MedicationAdministration = {
  id: string;
  outcome: (typeof medicationOutcomes)[number];
  scheduledFor: string;
  recordedAt: string;
  administeredAt: string | null;
  scheduleOverride: boolean;
  version: number;
  dosage?: string | null;
  reason?: string | null;
  note?: string | null;
  amendments?: HealthAmendment[];
};

export type Medication = {
  id: string;
  centreId: string;
  childId?: string;
  status:
    | "DRAFT"
    | "PARENT_AUTHORISED"
    | "MANAGER_APPROVED"
    | "ACTIVE"
    | "SUSPENDED"
    | "EXPIRED"
    | "DISCONTINUED"
    | "ARCHIVED";
  validFrom: string;
  expiresAt: string;
  highRisk: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  medicationName?: string | null;
  dosage?: string | null;
  instructions?: string | null;
  scheduleTimes?: string[];
  administrationWindowMinutes?: number;
  parentAuthorisedAt?: string | null;
  managerApprovedAt?: string | null;
  administrations?: MedicationAdministration[];
  amendments?: HealthAmendment[];
  administrationCount?: number;
  amendmentCount?: number;
};

export function healthControls(access: CurrentAccess, centreId: string) {
  return {
    canRead: hasPermission(access, "health.read", centreId),
    canManageProfile: hasPermission(access, "health.manage", centreId),
    canCreateMedication: hasPermission(access, "medication.create", centreId),
    canParentAuthorise: hasPermission(access, "medication.parent_authorise", centreId),
    canApprove: hasPermission(access, "medication.approve", centreId),
    canAdminister: hasPermission(access, "medication.administer", centreId),
    canSuspend: hasPermission(access, "medication.suspend", centreId),
    canCorrect: hasPermission(access, "medication.correct", centreId),
    canReadHistory: hasPermission(access, "medication.history.read", centreId),
  };
}
