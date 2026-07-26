import type { CurrentAccess } from "../access/access.types";
import { hasPermission } from "../access/access-policy";

export const reportTypes = [
  "DAILY_ATTENDANCE",
  "ATTENDANCE_HISTORY",
  "LATE_ARRIVAL",
  "LATE_PICKUP",
  "ROOM_OCCUPANCY",
  "CHILD_MOVEMENT",
  "PICKUP_ACTIVITY",
  "INCIDENT_STATISTICS",
  "SAFEGUARDING_METADATA",
  "MEDICATION_ADMINISTRATION",
  "MEDICATION_EXCEPTIONS",
  "MEDICATION_EXPIRY",
  "HEALTH_ALERT_COUNTS",
  "ANNOUNCEMENT_DELIVERY",
  "NOTIFICATION_DELIVERY",
  "COMMUNICATION_ACTIVITY",
  "USER_ROLE_ACTIVITY",
  "SECURITY_EVENTS",
  "CENTRE_OPERATIONAL_SUMMARY",
] as const;

export type ReportType = (typeof reportTypes)[number];

export type ReportResponse = {
  reportType: ReportType | "CENTRE_COMPARISON";
  generatedAt: string;
  filters: Record<string, string | number>;
  summary: { totalRows: number; returnedRows: number };
  rows: Array<Record<string, string | number | boolean | null>>;
  pagination: { page: number; pageSize: number; total: number };
};

const parentReports = new Set<ReportType>([
  "ATTENDANCE_HISTORY",
  "LATE_ARRIVAL",
  "LATE_PICKUP",
  "CHILD_MOVEMENT",
  "PICKUP_ACTIVITY",
  "INCIDENT_STATISTICS",
  "MEDICATION_ADMINISTRATION",
  "MEDICATION_EXCEPTIONS",
  "MEDICATION_EXPIRY",
  "ANNOUNCEMENT_DELIVERY",
  "COMMUNICATION_ACTIVITY",
]);

const educatorReports = new Set<ReportType>([
  "DAILY_ATTENDANCE",
  "ATTENDANCE_HISTORY",
  "LATE_ARRIVAL",
  "LATE_PICKUP",
  "ROOM_OCCUPANCY",
  "CHILD_MOVEMENT",
  "PICKUP_ACTIVITY",
  "INCIDENT_STATISTICS",
  "MEDICATION_ADMINISTRATION",
  "MEDICATION_EXCEPTIONS",
  "MEDICATION_EXPIRY",
  "HEALTH_ALERT_COUNTS",
  "ANNOUNCEMENT_DELIVERY",
  "NOTIFICATION_DELIVERY",
  "COMMUNICATION_ACTIVITY",
  "CENTRE_OPERATIONAL_SUMMARY",
]);

export function reportCatalogue(access: CurrentAccess, centreId: string): ReportType[] {
  if (!hasPermission(access, "report.read", centreId)) return [];
  const roles = access.assignments
    .filter((assignment) => assignment.centreId === centreId)
    .map(({ roleCode }) => roleCode);
  if (
    access.platformPermissions.includes("report.cross_centre") ||
    roles.includes("CENTRE_MANAGER") ||
    roles.includes("SECURITY_AUDITOR")
  ) {
    return [...reportTypes];
  }
  if (roles.includes("EDUCATOR")) return reportTypes.filter((type) => educatorReports.has(type));
  if (roles.includes("PARENT")) return reportTypes.filter((type) => parentReports.has(type));
  return [];
}
