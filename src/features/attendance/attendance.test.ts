import { describe, expect, test } from "vitest";

import type { CurrentAccess } from "../access/access.types";
import { attendanceMovementSchema, expectedAttendanceSchema } from "./attendance.schemas";
import { attendanceControls } from "./attendance.types";

describe("attendance validation and access", () => {
  test("rejects mass-assigned lifecycle status", () => {
    expect(
      expectedAttendanceSchema.safeParse({
        childId: "10000000-0000-4000-8000-000000000001",
        attendanceDate: "2026-07-26",
        expectedArrivalAt: "",
        expectedDepartureAt: "",
        note: "",
        status: "CHECKED_OUT",
      }).success,
    ).toBe(false);
    expect(
      attendanceMovementSchema.safeParse({
        reason: "Planned activity",
        destinationLabel: "Library",
      }).success,
    ).toBe(true);
  });

  test("derives controls only from server-issued permissions", () => {
    const access = {
      userId: "user",
      authenticationState: "MFA_AUTHENTICATED",
      platformPermissions: [],
      centres: [
        {
          centreId: "centre",
          permissions: ["attendance.read", "attendance.manage", "attendance.history.read"],
        },
      ],
      assignments: [],
    } as CurrentAccess;
    expect(attendanceControls(access, "centre")).toEqual({
      canRead: true,
      canManage: true,
      canCorrect: false,
      canReadHistory: true,
    });
    expect(attendanceControls(access, "other").canRead).toBe(false);
  });

  test("keeps auditor and unknown-role controls read-only or denied", () => {
    const auditor = {
      userId: "auditor",
      authenticationState: "MFA_AUTHENTICATED",
      platformPermissions: [],
      centres: [
        {
          centreId: "centre",
          permissions: ["attendance.read", "attendance.history.read"],
        },
      ],
      assignments: [],
    } as CurrentAccess;
    expect(attendanceControls(auditor, "centre")).toEqual({
      canRead: true,
      canManage: false,
      canCorrect: false,
      canReadHistory: true,
    });
    expect(
      attendanceControls(
        { ...auditor, centres: [], platformPermissions: [], assignments: [] },
        "centre",
      ),
    ).toEqual({
      canRead: false,
      canManage: false,
      canCorrect: false,
      canReadHistory: false,
    });
  });

  test("does not use browser storage for attendance data", () => {
    const sourceFiles = import.meta.glob<string>(["./*.ts", "../../pages/Attendance*.tsx"], {
      query: "?raw",
      import: "default",
      eager: true,
    });
    for (const source of Object.values(sourceFiles)) {
      expect(source).not.toMatch(/\b(?:localStorage|sessionStorage|indexedDB)\b/u);
    }
  });
});
