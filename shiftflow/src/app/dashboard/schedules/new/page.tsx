"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { scheduleSchema, type ScheduleFormData } from "@/lib/validations/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function NewSchedulePage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
  });

  const onSubmit = async (data: ScheduleFormData) => {
    if (!user?.organization_id) return;
    setLoading(true);
    const supabase = createClient();

    const { data: schedule, error } = await supabase
      .from("schedules")
      .insert({
        organization_id: user.organization_id,
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        created_by: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie utworzyc grafiku", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Sukces", description: "Grafik zostal utworzony" });
    router.push(`/dashboard/schedules/${schedule.id}`);
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Nowy grafik</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Szczegoly grafiku</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa grafiku</Label>
              <Input id="name" placeholder="np. Tydzien 1 - Luty 2026" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data poczatkowa</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data koncowa</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Anuluj
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Tworzenie..." : "Utworz grafik"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
