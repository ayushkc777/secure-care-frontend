import { describe, expect, test } from "vitest";

import type { CurrentAccess, Permission } from "../access/access.types";
import { pickupControls } from "./pickup.types";

const centreId = "00000000-0000-4000-8000-000000000001";

function access(roleCode: CurrentAccess["assignments"][number]["roleCode"], values: Permission[]) {
  return {
    userId: "00000000-0000-4000-8000-000000000101",
    authenticationState: "MFA_AUTHENTICATED",
    platformPermissions: [],
    centres: [{ centreId, permissions: values }],
    assignments: [
      {
        id: "00000000-0000-4000-8000-000000000401",
        roleCode,
        scope: "CENTRE",
        centreId,
      },
    ],
  } satisfies CurrentAccess;
}

describe("pickup control visibility", () => {
  test("Parent sees management controls but no staff verification or override", () => {
    const controls = pickupControls(
      access("PARENT", [
        "pickup_authorisation.read",
        "pickup_authorisation.create",
        "pickup_authorisation.update",
        "pickup_authorisation.revoke",
        "pickup_completion.read",
      ]),
      centreId,
    );
    expect(controls).toEqual({
      canCreate: true,
      canUpdate: true,
      canRevoke: true,
      canVerify: false,
      canComplete: false,
      canOverride: false,
    });
  });

  test("Educator sees standard verification but no management or override", () => {
    const controls = pickupControls(
      access("EDUCATOR", [
        "pickup_authorisation.read",
        "pickup_verification.read",
        "pickup_verification.perform",
        "pickup_completion.read",
        "pickup_completion.create",
      ]),
      centreId,
    );
    expect(controls.canVerify).toBe(true);
    expect(controls.canComplete).toBe(true);
    expect(controls.canCreate).toBe(false);
    expect(controls.canOverride).toBe(false);
  });

  test("Manager sees the emergency override control only with its permission", () => {
    const withoutOverride = access("CENTRE_MANAGER", ["pickup_verification.perform"]);
    expect(pickupControls(withoutOverride, centreId).canOverride).toBe(false);
    withoutOverride.centres[0]?.permissions.push("pickup_verification.override");
    expect(pickupControls(withoutOverride, centreId).canOverride).toBe(true);
  });

  test("Auditor and unknown roles receive no pickup controls", () => {
    expect(pickupControls(access("SECURITY_AUDITOR", ["audit.read"]), centreId)).toEqual({
      canCreate: false,
      canUpdate: false,
      canRevoke: false,
      canVerify: false,
      canComplete: false,
      canOverride: false,
    });
    const unknown = access("PARENT", []);
    unknown.assignments = [];
    expect(pickupControls(unknown, centreId).canCreate).toBe(false);
  });
});
