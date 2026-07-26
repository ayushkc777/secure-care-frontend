import { z } from "zod";

import { allergySeverities, medicationOutcomes } from "./health.types";

const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const healthProfileFormSchema = z
  .object({
    allergySeverity: z.enum(allergySeverities),
    allergies: optionalText(2_000),
    allergyTriggers: optionalText(2_000),
    emergencyInstructions: optionalText(3_000),
    dietaryRestrictions: optionalText(2_000),
    medicalConditions: optionalText(3_000),
    healthAlert: optionalText(500),
    hasActiveHealthAlert: z.boolean(),
    correctionReason: optionalText(1_000),
  })
  .refine((value) => value.allergySeverity === "NONE" || value.allergies.length > 0, {
    path: ["allergies"],
    message: "Describe the allergy when a severity is selected.",
  });

export const medicationFormSchema = z
  .object({
    medicationName: z.string().trim().min(2).max(300),
    dosage: z.string().trim().min(1).max(300),
    instructions: z.string().trim().min(10).max(3_000),
    scheduleTimes: z
      .string()
      .trim()
      .min(5)
      .transform((value) => value.split(",").map((time) => time.trim()))
      .pipe(
        z
          .array(z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/u))
          .min(1)
          .max(12)
          .refine((times) => new Set(times).size === times.length, "Times must be unique."),
      ),
    administrationWindowMinutes: z.coerce.number().int().min(5).max(180),
    validFrom: z.string().min(1),
    expiresAt: z.string().min(1),
    highRisk: z.boolean(),
  })
  .refine((value) => new Date(value.expiresAt) > new Date(value.validFrom), {
    path: ["expiresAt"],
    message: "Expiry must be after the valid-from time.",
  });

export const administrationFormSchema = z
  .object({
    scheduledFor: z.string().min(1),
    outcome: z.enum(medicationOutcomes),
    dosage: optionalText(300),
    reason: optionalText(1_000),
    note: optionalText(1_000),
    scheduleOverride: z.boolean(),
    overrideReason: optionalText(1_000),
  })
  .superRefine((value, context) => {
    if (value.outcome !== "ADMINISTERED" && value.reason.length < 2) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Record a reason for a non-administered outcome.",
      });
    }
    if (value.scheduleOverride && value.overrideReason.length < 10) {
      context.addIssue({
        code: "custom",
        path: ["overrideReason"],
        message: "Document why the schedule was overridden.",
      });
    }
  });

export const amendmentFormSchema = z.object({
  reason: z.string().trim().min(10).max(1_000),
  correctedContent: z.string().trim().min(1).max(3_000),
  medicationError: z.boolean(),
});

export type HealthProfileForm = z.infer<typeof healthProfileFormSchema>;
export type MedicationFormInput = z.input<typeof medicationFormSchema>;
export type MedicationForm = z.output<typeof medicationFormSchema>;
export type AdministrationForm = z.infer<typeof administrationFormSchema>;
export type AmendmentForm = z.infer<typeof amendmentFormSchema>;
