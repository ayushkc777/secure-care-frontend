export const Permission = {
  AccountManageSelf: "account.manage_self",
  RoleAssignmentRead: "role_assignment.read",
  RoleAssignmentManage: "role_assignment.manage",
  CentreRead: "centre.read",
  CentreManage: "centre.manage",
  RoomRead: "room.read",
  RoomManage: "room.manage",
  ChildRead: "child.read",
  ChildCreate: "child.create",
  ChildUpdate: "child.update",
  ChildArchive: "child.archive",
  RelationshipRead: "relationship.read",
  RelationshipManage: "relationship.manage",
  EnrolmentRead: "enrolment.read",
  EnrolmentManage: "enrolment.manage",
  IncidentRead: "incident.read",
  IncidentCreate: "incident.create",
  IncidentUpdateDraft: "incident.update_draft",
  IncidentSubmit: "incident.submit",
  IncidentReview: "incident.review",
  IncidentApprove: "incident.approve",
  IncidentAmend: "incident.amend",
  IncidentArchive: "incident.archive",
  IncidentParentAcknowledge: "incident.parent_acknowledge",
  IncidentHistoryRead: "incident.history.read",
  SafeguardingCreate: "safeguarding.create",
  SafeguardingRead: "safeguarding.read",
  SafeguardingReview: "safeguarding.review",
  SafeguardingEscalate: "safeguarding.escalate",
  SafeguardingClose: "safeguarding.close",
  PickupAuthorisationManage: "pickup_authorisation.manage",
  PickupAuthorisationRead: "pickup_authorisation.read",
  PickupAuthorisationCreate: "pickup_authorisation.create",
  PickupAuthorisationUpdate: "pickup_authorisation.update",
  PickupAuthorisationRevoke: "pickup_authorisation.revoke",
  PickupVerificationRead: "pickup_verification.read",
  PickupVerificationPerform: "pickup_verification.perform",
  PickupVerificationOverride: "pickup_verification.override",
  PickupCompletionRead: "pickup_completion.read",
  PickupCompletionCreate: "pickup_completion.create",
  AttendanceRead: "attendance.read",
  AttendanceManage: "attendance.manage",
  AttendanceCorrect: "attendance.correct",
  AttendanceHistoryRead: "attendance.history.read",
  HealthRead: "health.read",
  HealthManage: "health.manage",
  MedicationRead: "medication.read",
  MedicationCreate: "medication.create",
  MedicationParentAuthorise: "medication.parent_authorise",
  MedicationApprove: "medication.approve",
  MedicationAdminister: "medication.administer",
  MedicationSuspend: "medication.suspend",
  MedicationCorrect: "medication.correct",
  MedicationHistoryRead: "medication.history.read",
  CommunicationRead: "communication.read",
  CommunicationSend: "communication.send",
  CommunicationManage: "communication.manage",
  CommunicationAuditRead: "communication.audit.read",
  NotificationRead: "notification.read",
  NotificationPreferenceManage: "notification_preference.manage",
  ReportRead: "report.read",
  ReportSensitiveRead: "report.sensitive.read",
  ReportExport: "report.export",
  ReportCrossCentre: "report.cross_centre",
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
