"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { employeeSchema, type EmployeeFormData } from "@/lib/validations/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { SKILLS, SHIFT_TYPES } from "@/lib/constants";

interface AddEmployeeFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function AddEmployeeForm({ organizationId, onSuccess }: AddEmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { skills: [], preferredShiftTypes: [], maxHoursPerWeek: 40 },
  });

  const selectedSkills = watch("skills");
  const selectedShifts = watch("preferredShiftTypes");

  const toggleSkill = (skill: string) => {
    const current = selectedSkills || [];
    const updated = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setValue("skills", updated);
  };

  const toggleShift = (shift: string) => {
    const current = selectedShifts || [];
    const updated = current.includes(shift)
      ? current.filter((s) => s !== shift)
      : [...current, shift];
    setValue("preferredShiftTypes", updated);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    const supabase = createClient();

    // Create auth user with a temporary password
    const tempPassword = Math.random().toString(36).slice(2) + "Aa1!";
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: tempPassword,
      options: { data: { full_name: data.fullName, role: "employee" } },
    });

    if (authError || !authData.user) {
      toast({ title: "Blad", description: authError?.message ?? "Nie udalo sie utworzyc konta", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone || null,
      role: "employee",
      organization_id: organizationId,
    });

    if (profileError) {
      toast({ title: "Blad", description: "Nie udalo sie utworzyc profilu", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create employee record
    const { error: empError } = await supabase.from("employees").insert({
      id: authData.user.id,
      hourly_rate: data.hourlyRate || null,
      skills: data.skills,
      max_hours_per_week: data.maxHoursPerWeek,
      preferred_shift_types: data.preferredShiftTypes,
    });

    if (empError) {
      toast({ title: "Blad", description: "Nie udalo sie utworzyc rekordu pracownika", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Sukces", description: `Pracownik ${data.fullName} zostal dodany` });
    setLoading(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Imie i nazwisko</Label>
        <Input id="fullName" placeholder="Jan Kowalski" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jan@firma.pl" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon (opcjonalnie)</Label>
        <Input id="phone" placeholder="+48 123 456 789" {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Stawka godzinowa (PLN)</Label>
          <Input id="hourlyRate" type="number" step="0.01" placeholder="25.00" {...register("hourlyRate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxHoursPerWeek">Max godzin/tydzien</Label>
          <Input id="maxHoursPerWeek" type="number" {...register("maxHoursPerWeek")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Umiejetnosci</Label>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedSkills?.includes(skill)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-accent"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preferowane zmiany</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SHIFT_TYPES).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleShift(key)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedShifts?.includes(key)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-accent"
              }`}
            >
              {val.label} ({val.start}-{val.end})
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Dodawanie..." : "Dodaj pracownika"}
      </Button>
    </form>
  );
}
