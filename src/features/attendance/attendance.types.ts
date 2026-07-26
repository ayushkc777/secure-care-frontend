import type { CurrentAccess } from "../access/access.types";

export type AttendanceStatus =
  "EXPECTED" | "CHECKED_IN" | "TEMPORARILY_OUT" | "CHECKED_OUT" | "ABSENT" | "CANCELLED";

export type AttendanceEvent = {
  id: string;
  type: string;
  statusAfter: AttendanceStatus;
  occurredAt: string;
  recordVersion: number;
  originRoomId?: string | null;
  destinationRoomId?: string | null;
  reason?: string | null;
};

export type AttendanceRecord = {
  id: string;
  centreId: string;
  childId?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  currentRoomId: string | null;
  expectedArrivalAt: string | null;
  expectedDepartureAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  lateArrival: boolean;
  latePickup: boolean;
  version: number;
  note?: string | null;
  events?: AttendanceEvent[];
};

export function attendanceControls(access: CurrentAccess, centreId: string) {
  const permissions = new Set([
    ...access.platformPermissions,
    ...(access.centres.find((centre) => centre.centreId === centreId)?.permissions ?? []),
  ]);
  return {
    canRead: permissions.has("attendance.read"),
    canManage: permissions.has("attendance.manage"),
    canCorrect: permissions.has("attendance.correct"),
    canReadHistory: permissions.has("attendance.history.read"),
  };
}
