import { z } from "zod";

export const scheduleSchema = z.object({
  name: z.string().min(1, "Nazwa grafiku jest wymagana"),
  startDate: z.string().min(1, "Data poczatkowa jest wymagana"),
  endDate: z.string().min(1, "Data koncowa jest wymagana"),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const shiftSchema = z.object({
  employeeId: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakDurationMinutes: z.coerce.number().min(0).default(0),
  shiftType: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type ShiftFormData = z.infer<typeof shiftSchema>;
