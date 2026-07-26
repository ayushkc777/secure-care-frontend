import { z } from "zod";

const uuid = z.uuid();
const safeText = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !/[<>]/u.test(value), "Use plaintext only; HTML is not accepted.");

export const conversationFormSchema = z
  .object({
    childId: uuid,
    participantUserIds: z
      .string()
      .trim()
      .transform((value) => value.split(",").map((item) => item.trim()))
      .pipe(z.array(uuid).min(1).max(50)),
    subject: safeText(3, 200),
    body: safeText(1, 5_000),
    important: z.boolean(),
  })
  .strict();

export const replyFormSchema = z
  .object({
    body: safeText(1, 5_000),
    important: z.boolean(),
  })
  .strict();

export const amendmentFormSchema = z
  .object({
    correctedBody: safeText(1, 5_000),
    reason: safeText(10, 1_000),
  })
  .strict();

export const announcementFormSchema = z
  .object({
    scope: z.enum(["CENTRE", "ROOM", "CHILD"]),
    scopeId: z.string().trim(),
    title: safeText(3, 200),
    content: safeText(1, 10_000),
    important: z.boolean(),
    requiresAcknowledgement: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.scope !== "CENTRE" && !uuid.safeParse(value.scopeId).success) {
      context.addIssue({
        code: "custom",
        path: ["scopeId"],
        message: "A valid room or child ID is required.",
      });
    }
  });

export type ConversationFormInput = z.input<typeof conversationFormSchema>;
export type ConversationForm = z.output<typeof conversationFormSchema>;
export type ReplyForm = z.infer<typeof replyFormSchema>;
export type AmendmentForm = z.infer<typeof amendmentFormSchema>;
export type AnnouncementForm = z.infer<typeof announcementFormSchema>;
