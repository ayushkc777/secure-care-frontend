import { describe, expect, test } from "vitest";

import {
  centreFormSchema,
  childFormSchema,
  relationshipFormSchema,
  roomFormSchema,
} from "./childcare.schemas";

describe("childcare form schemas", () => {
  test("rejects unsupported centre and child properties", () => {
    expect(
      centreFormSchema.safeParse({
        name: "Willow Centre",
        slug: "willow-centre",
        timezone: "Europe/London",
        status: "ACTIVE",
      }).success,
    ).toBe(false);
    expect(
      childFormSchema.safeParse({
        externalReference: "CHILD-1",
        firstName: "Fictional",
        lastName: "Child",
        preferredName: "",
        dateOfBirth: "2020-01-01",
        careNotes: "",
        enrolledAt: "",
        centreId: "fbab26aa-7d06-4933-802a-91ef3ccb9dbc",
      }).success,
    ).toBe(false);
  });

  test("rejects future birth dates and unsafe room capacity", () => {
    expect(
      childFormSchema.safeParse({
        externalReference: "CHILD-1",
        firstName: "Future",
        lastName: "Child",
        preferredName: "",
        dateOfBirth: "2099-01-01",
        careNotes: "",
        enrolledAt: "",
      }).success,
    ).toBe(false);
    expect(roomFormSchema.safeParse({ name: "Room", capacity: 0 }).success).toBe(false);
    expect(roomFormSchema.safeParse({ name: "Room", capacity: 201 }).success).toBe(false);
  });

  test("accepts only supported relationship flags", () => {
    const valid = {
      parentEmail: "parent@example.invalid",
      relationshipType: "LEGAL_GUARDIAN",
      isLegalGuardian: true,
      mayAuthorizePickup: false,
      mayViewIncidents: true,
    };
    expect(relationshipFormSchema.safeParse(valid).success).toBe(true);
    expect(relationshipFormSchema.safeParse({ ...valid, mayManageChild: true }).success).toBe(
      false,
    );
  });
});
