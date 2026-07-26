import { z } from "zod";

const internationalPhone = /^\+[1-9]\d{7,14}$/u;
const pickupCode = /^[A-HJ-NP-Z2-9]{10}$/u;

export const pickupAuthorisationFormSchema = z
  .object({
    ownerParentEmail: z.union([z.literal(""), z.email().max(254)]),
    displayName: z.string().trim().min(2).max(160),
    relationshipLabel: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(internationalPhone),
    referenceNote: z.string().trim().max(500),
    validFrom: z.string().min(1),
    validUntil: z.string().min(1),
    isRecurring: z.boolean(),
    restrictions: z.string().trim().max(1_000),
  })
  .strict()
  .refine((value) => new Date(value.validUntil) > new Date(value.validFrom), {
    message: "The end time must be after the start time.",
    path: ["validUntil"],
  });

export const pickupEditFormSchema = z
  .object({
    validFrom: z.string().min(1),
    validUntil: z.string().min(1),
    restrictions: z.string().trim().max(1_000),
  })
  .strict()
  .refine((value) => new Date(value.validUntil) > new Date(value.validFrom), {
    message: "The end time must be after the start time.",
    path: ["validUntil"],
  });

export const pickupVerificationFormSchema = z
  .object({
    authorisationId: z.uuid(),
    code: z.string().trim().toUpperCase().regex(pickupCode),
    identityCheckMethod: z.enum(["PHOTO_MATCH", "PHYSICAL_ID_SIGHTED", "KNOWN_TO_CENTRE"]),
  })
  .strict();

export const pickupOverrideFormSchema = z
  .object({
    authorisationId: z.uuid(),
    reason: z.string().trim().min(20).max(1_000),
  })
  .strict();

export type PickupAuthorisationForm = z.infer<typeof pickupAuthorisationFormSchema>;
export type PickupEditForm = z.infer<typeof pickupEditFormSchema>;
export type PickupVerificationForm = z.infer<typeof pickupVerificationFormSchema>;
export type PickupOverrideForm = z.infer<typeof pickupOverrideFormSchema>;
