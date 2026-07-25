import { z } from "zod";

export const centreFormSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case words separated by hyphens."),
    timezone: z.string().trim().min(1).max(64),
  })
  .strict();

export const roomFormSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    capacity: z.number().int().min(1).max(200),
  })
  .strict();

export const childFormSchema = z
  .object({
    externalReference: z.string().trim().min(1).max(80),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    preferredName: z.string().trim().max(100),
    dateOfBirth: z.iso.date().refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), {
      message: "Date of birth cannot be in the future.",
    }),
    careNotes: z.string().trim().max(4_000),
    enrolledAt: z.union([z.literal(""), z.iso.date()]),
  })
  .strict();

export const relationshipFormSchema = z
  .object({
    parentEmail: z.email().trim().toLowerCase().max(254),
    relationshipType: z.enum(["MOTHER", "FATHER", "LEGAL_GUARDIAN", "FOSTER_CARER", "OTHER"]),
    isLegalGuardian: z.boolean(),
    mayAuthorizePickup: z.boolean(),
    mayViewIncidents: z.boolean(),
  })
  .strict();

export const enrolmentFormSchema = z.object({ roomId: z.uuid() }).strict();

export type CentreForm = z.infer<typeof centreFormSchema>;
export type RoomForm = z.infer<typeof roomFormSchema>;
export type ChildForm = z.infer<typeof childFormSchema>;
export type RelationshipForm = z.infer<typeof relationshipFormSchema>;
export type EnrolmentForm = z.infer<typeof enrolmentFormSchema>;
