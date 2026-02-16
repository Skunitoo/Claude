import { z } from "zod";

export const employeeSchema = z.object({
  fullName: z.string().min(2, "Imie i nazwisko jest wymagane"),
  email: z.string().email("Podaj prawidlowy adres email"),
  phone: z
    .string()
    .regex(/^\+?48\s?\d{3}\s?\d{3}\s?\d{3}$/, "Podaj prawidlowy numer telefonu (+48 XXX XXX XXX)")
    .optional()
    .or(z.literal("")),
  hourlyRate: z.coerce.number().min(0).optional(),
  skills: z.array(z.string()).default([]),
  maxHoursPerWeek: z.coerce.number().min(1).max(60).default(40),
  preferredShiftTypes: z.array(z.string()).default([]),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

export const bulkEmployeeSchema = z.object({
  csv: z.string().min(1, "Plik CSV jest wymagany"),
});
