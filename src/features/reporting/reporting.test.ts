import { describe, expect, test } from "vitest";

import type { CurrentAccess } from "../access/access.types";
import { reportFilterSchema } from "./reporting.schemas";
import { reportCatalogue } from "./reporting.types";

const centreId = "00000000-0000-4000-8000-000000000001";

function access(
  roleCode: CurrentAccess["assignments"][number]["roleCode"],
  permissions: CurrentAccess["centres"][number]["permissions"],
): CurrentAccess {
  return {
    userId: centreId,
    authenticationState: "MFA_AUTHENTICATED",
    platformPermissions: [],
    centres: [{ centreId, permissions }],
    assignments: [{ id: centreId, roleCode, scope: "CENTRE", centreId }],
  };
}

describe("Phase 13 reporting policy and validation", () => {
  test("limits the Parent catalogue and requires bounded dates", () => {
    const parent = access("PARENT", ["report.read", "report.export"]);
    expect(reportCatalogue(parent, centreId)).toContain("ATTENDANCE_HISTORY");
    expect(reportCatalogue(parent, centreId)).not.toContain("SECURITY_EVENTS");
    expect(
      reportFilterSchema.safeParse({
        from: "2024-01-01",
        to: "2026-01-02",
        roomId: "",
        childId: centreId,
        status: "",
        pageSize: 25,
      }).success,
    ).toBe(false);
  });

  test("gives auditors the metadata catalogue but no authority without report permission", () => {
    const auditor = access("SECURITY_AUDITOR", ["report.read"]);
    expect(reportCatalogue(auditor, centreId)).toContain("SECURITY_EVENTS");
    expect(reportCatalogue(access("SECURITY_AUDITOR", []), centreId)).toEqual([]);
  });
});
