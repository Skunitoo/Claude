import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Podaj prawidlowy adres email"),
  password: z.string().min(6, "Haslo musi miec co najmniej 6 znakow"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email("Podaj prawidlowy adres email"),
    password: z.string().min(6, "Haslo musi miec co najmniej 6 znakow"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Imie i nazwisko jest wymagane"),
    role: z.enum(["manager", "employee"]),
    organizationName: z.string().optional(),
    industry: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasla nie sa identyczne",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
