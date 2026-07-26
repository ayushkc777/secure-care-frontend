import { describe, expect, test } from "vitest";

import type { CurrentAccess, Permission } from "../access/access.types";
import { incidentControls } from "./incident.types";

const centreId = "40000000-0000-4000-8000-000000000001";

function access(roleCode: CurrentAccess["assignments"][number]["roleCode"], values: Permission[]) {
  return {
    userId: "50000000-0000-4000-8000-000000000001",
    authenticationState: "MFA_AUTHENTICATED",
    platformPermissions: [],
    centres: [{ centreId, permissions: values }],
    assignments: [
      {
        id: "60000000-0000-4000-8000-000000000001",
        roleCode,
        scope: "CENTRE",
        centreId,
      },
    ],
  } satisfies CurrentAccess;
}

describe("incident permission controls", () => {
  test("Educator receives draft and submission controls but no approval controls", () => {
    const controls = incidentControls(
      access("EDUCATOR", [
        "incident.read",
        "incident.create",
        "incident.update_draft",
        "incident.submit",
        "incident.history.read",
      ]),
      centreId,
    );
    expect(controls).toMatchObject({
      canCreate: true,
      canEditDraft: true,
      canSubmit: true,
      canApprove: false,
      canAmend: false,
      canArchive: false,
    });
  });

  test("Manager receives review, approval and amendment controls", () => {
    const controls = incidentControls(
      access("CENTRE_MANAGER", [
        "incident.read",
        "incident.review",
        "incident.approve",
        "incident.amend",
        "incident.archive",
        "safeguarding.read",
        "safeguarding.escalate",
      ]),
      centreId,
    );
    expect(controls.canReview).toBe(true);
    expect(controls.canApprove).toBe(true);
    expect(controls.canAmend).toBe(true);
    expect(controls.canReadSafeguarding).toBe(true);
    expect(controls.canManageSafeguarding).toBe(true);
  });

  test("Parent receives acknowledgement only and Auditor receives metadata history only", () => {
    const parent = incidentControls(
      access("PARENT", ["incident.read", "incident.parent_acknowledge", "incident.history.read"]),
      centreId,
    );
    expect(parent.canAcknowledge).toBe(true);
    expect(parent.canApprove).toBe(false);
    expect(parent.canReadSafeguarding).toBe(false);

    const auditor = incidentControls(
      access("SECURITY_AUDITOR", ["incident.history.read"]),
      centreId,
    );
    expect(auditor.canReadHistory).toBe(true);
    expect(auditor.canCreate).toBe(false);
    expect(auditor.canReadSafeguarding).toBe(false);
  });
});
