import { z } from "zod";

export const expectedAttendanceSchema = z
  .object({
    childId: z.uuid(),
    attendanceDate: z.iso.date(),
    expectedArrivalAt: z.string(),
    expectedDepartureAt: z.string(),
    note: z.string().trim().max(1_000),
  })
  .strict()
  .refine(
    (value) =>
      value.expectedArrivalAt.length === 0 ||
      value.expectedDepartureAt.length === 0 ||
      new Date(value.expectedDepartureAt) > new Date(value.expectedArrivalAt),
    { path: ["expectedDepartureAt"], message: "Departure must be after arrival." },
  );

export const attendanceMovementSchema = z
  .object({
    destinationRoomId: z.uuid().optional(),
    destinationLabel: z.string().trim().min(2).max(160).optional(),
    reason: z.string().trim().min(2).max(1_000),
  })
  .strict();
