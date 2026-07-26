import { z } from "zod";

export const incidentCategories = [
  "ACCIDENT",
  "INJURY",
  "ILLNESS",
  "BEHAVIOUR",
  "PEER_CONFLICT",
  "PROPERTY_DAMAGE",
  "MISSING_CHILD_CONCERN",
  "UNAUTHORISED_ACCESS",
  "SAFEGUARDING_CONCERN",
  "OTHER",
] as const;
export const incidentSeverities = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;

export const incidentFormSchema = z
  .object({
    childId: z.uuid(),
    category: z.enum(incidentCategories),
    severity: z.enum(incidentSeverities),
    occurredAt: z.string().min(1, "Enter the occurrence date and time."),
    location: z.string().trim().min(2).max(200),
    description: z.string().trim().min(20).max(10_000),
    injuryDetails: z.string().trim().max(10_000),
    symptoms: z.string().trim().max(10_000),
    immediateActions: z.string().trim().min(2).max(10_000),
    firstAid: z.string().trim().max(10_000),
    emergencyServicesContacted: z.boolean(),
    parentContacted: z.boolean(),
    safeguardingClassification: z
      .enum(["INTERNAL_CONCERN", "IMMEDIATE_RISK", "DISCLOSURE", "PATTERN_OF_CONCERN", "OTHER"])
      .optional(),
    safeguardingNarrative: z.string().trim().max(10_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.category === "SAFEGUARDING_CONCERN" &&
      (value.safeguardingClassification === undefined || value.safeguardingNarrative.length < 20)
    ) {
      context.addIssue({
        code: "custom",
        path: ["safeguardingNarrative"],
        message: "Provide a classification and at least 20 characters.",
      });
    }
  });

export const acknowledgementSchema = z.object({ comment: z.string().trim().max(2_000) }).strict();
export const reviewSchema = z.object({ note: z.string().trim().max(4_000) }).strict();
export const draftUpdateSchema = z
  .object({
    location: z.string().trim().min(2).max(200),
    description: z.string().trim().min(20).max(10_000),
    immediateActions: z.string().trim().min(2).max(10_000),
  })
  .strict();
export const returnSchema = z.object({ note: z.string().trim().min(10).max(4_000) }).strict();
export const amendmentSchema = z
  .object({
    reason: z.string().trim().min(10).max(4_000),
    content: z.string().trim().min(1).max(10_000),
    changedField: z.enum([
      "description",
      "injuryDetails",
      "symptoms",
      "immediateActions",
      "firstAid",
      "followUp",
    ]),
    parentVisible: z.boolean(),
  })
  .strict();
export const safeguardingReasonSchema = z
  .object({ reason: z.string().trim().min(20).max(4_000) })
  .strict();

export type IncidentForm = z.infer<typeof incidentFormSchema>;
export type AcknowledgementForm = z.infer<typeof acknowledgementSchema>;
export type ReviewForm = z.infer<typeof reviewSchema>;
export type DraftUpdateForm = z.infer<typeof draftUpdateSchema>;
export type ReturnForm = z.infer<typeof returnSchema>;
export type AmendmentForm = z.infer<typeof amendmentSchema>;
export type SafeguardingReasonForm = z.infer<typeof safeguardingReasonSchema>;
