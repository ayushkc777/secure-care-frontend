import type { CurrentAccess } from "../access/access.types";

export type IncidentCategory =
  | "ACCIDENT"
  | "INJURY"
  | "ILLNESS"
  | "BEHAVIOUR"
  | "PEER_CONFLICT"
  | "PROPERTY_DAMAGE"
  | "MISSING_CHILD_CONCERN"
  | "UNAUTHORISED_ACCESS"
  | "SAFEGUARDING_CONCERN"
  | "OTHER";
export type IncidentSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type IncidentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PARENT_ACKNOWLEDGED"
  | "AMENDED"
  | "CLOSED"
  | "ARCHIVED";

export type Incident = {
  id: string;
  centreId: string;
  childId?: string;
  incidentNumber?: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  occurredAt: string;
  location?: string | null;
  description?: string | null;
  injuryDetails?: string | null;
  symptoms?: string | null;
  immediateActions?: string | null;
  firstAid?: string | null;
  followUp?: string | null;
  reviewNote?: string | null;
  emergencyServicesContacted?: boolean;
  parentContacted?: boolean;
  approvedAt?: string | null;
  version?: number;
  acknowledgement?: { id: string; status: string; acknowledgedAt: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type IncidentControls = {
  canCreate: boolean;
  canEditDraft: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
  canAmend: boolean;
  canArchive: boolean;
  canAcknowledge: boolean;
  canReadHistory: boolean;
  canReadSafeguarding: boolean;
  canManageSafeguarding: boolean;
};

export function incidentControls(access: CurrentAccess, centreId: string): IncidentControls {
  const permissions = new Set([
    ...access.platformPermissions,
    ...(access.centres.find((centre) => centre.centreId === centreId)?.permissions ?? []),
  ]);
  return {
    canCreate: permissions.has("incident.create"),
    canEditDraft: permissions.has("incident.update_draft"),
    canSubmit: permissions.has("incident.submit"),
    canReview: permissions.has("incident.review"),
    canApprove: permissions.has("incident.approve"),
    canAmend: permissions.has("incident.amend"),
    canArchive: permissions.has("incident.archive"),
    canAcknowledge: permissions.has("incident.parent_acknowledge"),
    canReadHistory: permissions.has("incident.history.read"),
    canReadSafeguarding: permissions.has("safeguarding.read"),
    canManageSafeguarding:
      permissions.has("safeguarding.review") ||
      permissions.has("safeguarding.escalate") ||
      permissions.has("safeguarding.close"),
  };
}
