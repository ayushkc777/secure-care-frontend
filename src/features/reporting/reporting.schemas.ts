import { z } from "zod";

export const reportFilterSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    roomId: z.string().trim(),
    childId: z.string().trim(),
    status: z.string().trim().max(40),
    pageSize: z.coerce.number().int().min(1).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const from = new Date(`${value.from}T00:00:00.000Z`);
    const to = new Date(`${value.to}T23:59:59.999Z`);
    if (to <= from) {
      context.addIssue({ code: "custom", path: ["to"], message: "Choose a later end date." });
    }
    if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1_000) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "Report ranges cannot exceed 366 days.",
      });
    }
    for (const key of ["roomId", "childId"] as const) {
      if (value[key] && !z.uuid().safeParse(value[key]).success) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "Enter a valid SecureCare record ID.",
        });
      }
    }
  });

export type ReportFilterInput = z.input<typeof reportFilterSchema>;
export type ReportFilter = z.output<typeof reportFilterSchema>;
