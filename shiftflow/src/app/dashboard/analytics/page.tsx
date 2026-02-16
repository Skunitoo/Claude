"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ArrowLeftRight,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Analytics {
  totalEmployees: number;
  activeEmployees: number;
  totalSchedules: number;
  publishedSchedules: number;
  totalShifts: number;
  totalHours: number;
  avgHoursPerEmployee: number;
  pendingSwaps: number;
  approvedSwaps: number;
  pendingTimeOff: number;
  estimatedCost: number;
}

export default function AnalyticsPage() {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.organization_id) return;
      const supabase = createClient();

      const [
        empRes,
        schedRes,
        shiftRes,
        swapRes,
        timeOffRes,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, employee:employees(is_active, hourly_rate)")
          .eq("organization_id", user.organization_id)
          .eq("role", "employee"),
        supabase
          .from("schedules")
          .select("id, status")
          .eq("organization_id", user.organization_id),
        supabase
          .from("shifts")
          .select("employee_id, start_time, end_time, break_duration_minutes")
          .eq("schedule_id", (await supabase
            .from("schedules")
            .select("id")
            .eq("organization_id", user.organization_id)
            .in("status", ["draft", "published"])
            .limit(100)).data?.map((s: { id: string }) => s.id)?.[0] || ""),
        supabase
          .from("swap_requests")
          .select("id, status"),
        supabase
          .from("time_off_requests")
          .select("id, status"),
      ]);

      const employees = empRes.data ?? [];
      const schedules = schedRes.data ?? [];
      const shifts = shiftRes.data ?? [];
      const swaps = swapRes.data ?? [];
      const timeoffs = timeOffRes.data ?? [];

      const totalHours = shifts.reduce((sum, s: { start_time: string; end_time: string; break_duration_minutes: number }) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        let start = sh * 60 + (sm || 0);
        let end = eh * 60 + (em || 0);
        if (end <= start) end += 24 * 60;
        return sum + (end - start - (s.break_duration_minutes || 0)) / 60;
      }, 0);

      const activeEmps = employees.filter(
        (e: { employee: { is_active: boolean } | null }) => e.employee?.is_active !== false
      ).length;

      setAnalytics({
        totalEmployees: employees.length,
        activeEmployees: activeEmps,
        totalSchedules: schedules.length,
        publishedSchedules: schedules.filter((s: { status: string }) => s.status === "published").length,
        totalShifts: shifts.length,
        totalHours,
        avgHoursPerEmployee: activeEmps > 0 ? totalHours / activeEmps : 0,
        pendingSwaps: swaps.filter((s: { status: string }) => s.status === "pending").length,
        approvedSwaps: swaps.filter((s: { status: string }) => s.status === "accepted").length,
        pendingTimeOff: timeoffs.filter((t: { status: string }) => t.status === "pending").length,
        estimatedCost: 0,
      });
      setLoading(false);
    }
    load();
  }, [user?.organization_id]);

  if (loading) return <p className="text-muted-foreground">Ladowanie analityki...</p>;
  if (!analytics) return <p className="text-destructive">Blad ladowania danych</p>;

  const stats = [
    { label: "Pracownicy", value: `${analytics.activeEmployees}/${analytics.totalEmployees}`, icon: Users, desc: "aktywni/lacznie" },
    { label: "Grafiki", value: analytics.totalSchedules, icon: Calendar, desc: `${analytics.publishedSchedules} opublikowanych` },
    { label: "Zmiany", value: analytics.totalShifts, icon: Clock, desc: `${analytics.totalHours.toFixed(0)}h lacznie` },
    { label: "Sr. godziny/pracownik", value: `${analytics.avgHoursPerEmployee.toFixed(1)}h`, icon: TrendingUp, desc: "w aktywnych grafikach" },
    { label: "Zamiany", value: analytics.pendingSwaps, icon: ArrowLeftRight, desc: `oczekujacych (${analytics.approvedSwaps} zaakceptowanych)` },
    { label: "Wnioski urlopowe", value: analytics.pendingTimeOff, icon: Clock, desc: "oczekujacych na rozpatrzenie" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analityka</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Organizacja ma {analytics.totalEmployees} pracownikow, z czego {analytics.activeEmployees} jest aktywnych.</p>
          <p>Laczna liczba zaplanowanych zmian: {analytics.totalShifts} ({analytics.totalHours.toFixed(0)} godzin).</p>
          {analytics.pendingSwaps > 0 && (
            <p className="text-yellow-600">{analytics.pendingSwaps} zamian oczekuje na akceptacje.</p>
          )}
          {analytics.pendingTimeOff > 0 && (
            <p className="text-yellow-600">{analytics.pendingTimeOff} wnioskow urlopowych oczekuje na rozpatrzenie.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
