import { describe, expect, test } from "vitest";

import { incidentFormSchema } from "./incident.schemas";

const valid = {
  childId: "40000000-0000-4000-8000-000000000001",
  category: "INJURY",
  severity: "MODERATE",
  occurredAt: "2026-07-25T10:30",
  location: "Fictional play area",
  description: "A sufficiently detailed and factual fictional incident description.",
  injuryDetails: "",
  symptoms: "",
  immediateActions: "The child was reassured.",
  firstAid: "",
  emergencyServicesContacted: false,
  parentContacted: true,
  safeguardingNarrative: "",
} as const;

describe("incident form validation", () => {
  test("accepts a bounded ordinary incident", () => {
    expect(incidentFormSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects unknown fields and enum values", () => {
    expect(
      incidentFormSchema.safeParse({ ...valid, severity: "EXTREME", approved: true }).success,
    ).toBe(false);
  });

  test("requires restricted details for a safeguarding concern", () => {
    expect(
      incidentFormSchema.safeParse({ ...valid, category: "SAFEGUARDING_CONCERN" }).success,
    ).toBe(false);
    expect(
      incidentFormSchema.safeParse({
        ...valid,
        category: "SAFEGUARDING_CONCERN",
        safeguardingClassification: "INTERNAL_CONCERN",
        safeguardingNarrative:
          "A fictional restricted concern requiring an internal Manager review.",
      }).success,
    ).toBe(true);
  });
});
