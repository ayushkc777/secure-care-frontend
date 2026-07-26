import { describe, expect, test } from "vitest";

import {
  pickupAuthorisationFormSchema,
  pickupOverrideFormSchema,
  pickupVerificationFormSchema,
} from "./pickup.schemas";

const validAuthorisation = {
  ownerParentEmail: "",
  displayName: "Fictional Pickup Person",
  relationshipLabel: "Family friend",
  phone: "+447700900111",
  referenceNote: "",
  validFrom: "2026-07-26T09:00",
  validUntil: "2026-07-26T18:00",
  isRecurring: false,
  restrictions: "",
};

describe("pickup form schemas", () => {
  test("accepts bounded normalised authorisation input", () => {
    expect(pickupAuthorisationFormSchema.safeParse(validAuthorisation).success).toBe(true);
  });

  test("rejects invalid periods, phones and server-controlled properties", () => {
    expect(
      pickupAuthorisationFormSchema.safeParse({
        ...validAuthorisation,
        validUntil: "2026-07-26T08:00",
      }).success,
    ).toBe(false);
    expect(
      pickupAuthorisationFormSchema.safeParse({ ...validAuthorisation, phone: "07700 900111" })
        .success,
    ).toBe(false);
    expect(
      pickupAuthorisationFormSchema.safeParse({
        ...validAuthorisation,
        status: "ACTIVE",
      }).success,
    ).toBe(false);
  });

  test("accepts only the unambiguous ten-character code alphabet", () => {
    expect(
      pickupVerificationFormSchema.safeParse({
        authorisationId: "00000000-0000-4000-8000-000000000801",
        code: "ABCD234567",
        identityCheckMethod: "KNOWN_TO_CENTRE",
      }).success,
    ).toBe(true);
    expect(
      pickupVerificationFormSchema.safeParse({
        authorisationId: "00000000-0000-4000-8000-000000000801",
        code: "ABC10OIL89",
        identityCheckMethod: "KNOWN_TO_CENTRE",
      }).success,
    ).toBe(false);
  });

  test("requires a bounded emergency reason", () => {
    expect(
      pickupOverrideFormSchema.safeParse({
        authorisationId: "00000000-0000-4000-8000-000000000801",
        reason: "Too short",
      }).success,
    ).toBe(false);
    expect(
      pickupOverrideFormSchema.safeParse({
        authorisationId: "00000000-0000-4000-8000-000000000801",
        reason: "A fictional documented emergency reason for this pickup.",
      }).success,
    ).toBe(true);
  });
});
