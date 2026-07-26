import { describe, expect, it } from "vitest";

import type { CurrentAccess } from "../access/access.types";
import {
  administrationFormSchema,
  healthProfileFormSchema,
  medicationFormSchema,
} from "./health.schemas";
import { healthControls } from "./health.types";

const access: CurrentAccess = {
  userId: "00000000-0000-4000-8000-000000000001",
  authenticationState: "MFA_AUTHENTICATED",
  platformPermissions: [],
  centres: [
    {
      centreId: "00000000-0000-4000-8000-000000000002",
      permissions: [
        "health.read",
        "medication.read",
        "medication.administer",
        "medication.history.read",
      ],
    },
  ],
  assignments: [],
};

describe("Phase 11 health contracts", () => {
  it("requires allergy detail when an allergy severity is recorded", () => {
    expect(
      healthProfileFormSchema.safeParse({
        allergySeverity: "SEVERE",
        allergies: "",
        allergyTriggers: "",
        emergencyInstructions: "",
        dietaryRestrictions: "",
        medicalConditions: "",
        healthAlert: "",
        hasActiveHealthAlert: true,
        correctionReason: "",
      }).success,
    ).toBe(false);
  });

  it("normalises and validates unique medication schedule times", () => {
    const valid = medicationFormSchema.safeParse({
      medicationName: "Fictional medicine",
      dosage: "5 mL",
      instructions: "Administer according to the authorised record.",
      scheduleTimes: "09:00, 13:00",
      administrationWindowMinutes: 30,
      validFrom: "2026-07-01T09:00",
      expiresAt: "2027-07-01T09:00",
      highRisk: false,
    });
    expect(valid.success && valid.data.scheduleTimes).toEqual(["09:00", "13:00"]);
    expect(
      medicationFormSchema.safeParse({
        medicationName: "Fictional medicine",
        dosage: "5 mL",
        instructions: "Administer according to the authorised record.",
        scheduleTimes: "09:00, 09:00",
        administrationWindowMinutes: 30,
        validFrom: "2026-07-01T09:00",
        expiresAt: "2027-07-01T09:00",
        highRisk: false,
      }).success,
    ).toBe(false);
  });

  it("requires reasons for refused outcomes and schedule overrides", () => {
    expect(
      administrationFormSchema.safeParse({
        scheduledFor: "2026-07-22T09:00",
        outcome: "REFUSED",
        dosage: "",
        reason: "",
        note: "",
        scheduleOverride: true,
        overrideReason: "",
      }).success,
    ).toBe(false);
  });

  it("derives controls only from centre-scoped permissions", () => {
    expect(healthControls(access, access.centres[0]!.centreId).canAdminister).toBe(true);
    expect(healthControls(access, "00000000-0000-4000-8000-000000000099").canAdminister).toBe(
      false,
    );
    expect(healthControls(access, access.centres[0]!.centreId).canApprove).toBe(false);
  });
});
