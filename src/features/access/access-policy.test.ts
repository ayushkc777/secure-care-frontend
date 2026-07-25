import { describe, expect, test } from "vitest";

import { hasPermission, protectedDestination, visibleAccessNavigation } from "./access-policy";
import type { CurrentAccess } from "./access.types";

const access: CurrentAccess = {
  userId: "7b3cad06-d1b3-431d-8e10-6969b847a5aa",
  authenticationState: "MFA_AUTHENTICATED",
  platformPermissions: [],
  centres: [
    {
      centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
      permissions: ["account.manage_self", "child.read", "role_assignment.read"],
    },
  ],
  assignments: [
    {
      id: "2952e833-18d7-476e-8c32-8c541f8f2d82",
      roleCode: "CENTRE_MANAGER",
      scope: "CENTRE",
      centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
    },
  ],
};

describe("access policy", () => {
  test("distinguishes unauthenticated, restricted and denied states", () => {
    expect(protectedDestination({ status: "unauthenticated", access: null })).toBe("/login");
    expect(protectedDestination({ status: "restricted", access: null })).toBe("/mfa/required");
    expect(protectedDestination({ status: "error", access: null })).toBe("/access-denied");
    expect(protectedDestination({ status: "ready", access }, "audit.read")).toBe("/access-denied");
  });

  test("requires the requested centre when checking centre permissions", () => {
    expect(hasPermission(access, "child.read", "fbab26aa-7d06-4933-802a-91ef3ccb9dbc")).toBe(true);
    expect(hasPermission(access, "child.read", "5045d50e-880f-4ea5-8241-c9e71c9eaa93")).toBe(false);
    expect(
      protectedDestination(
        { status: "ready", access },
        "child.read",
        "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
      ),
    ).toBe("allow");
  });

  test("derives navigation from server-provided permissions", () => {
    expect(visibleAccessNavigation(access)).toEqual([
      { label: "My access", to: "/access" },
      { label: "Care records", to: "/care" },
      { label: "Role assignments", to: "/access/role-assignments" },
      { label: "Child access check", to: "/access/child" },
    ]);
  });

  test("shows care navigation without exposing manager-only controls", () => {
    const parentAccess: CurrentAccess = {
      ...access,
      centres: [
        {
          centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
          permissions: ["account.manage_self", "centre.read", "room.read", "child.read"],
        },
      ],
      assignments: [
        {
          id: "2952e833-18d7-476e-8c32-8c541f8f2d82",
          roleCode: "PARENT",
          scope: "CENTRE",
          centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
        },
      ],
    };
    expect(visibleAccessNavigation(parentAccess)).toContainEqual({
      label: "Care records",
      to: "/care",
    });
    expect(hasPermission(parentAccess, "relationship.manage")).toBe(false);
    expect(hasPermission(parentAccess, "enrolment.manage")).toBe(false);
  });
});
