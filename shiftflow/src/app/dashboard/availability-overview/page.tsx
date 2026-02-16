"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AVAILABILITY_STATUS, DAYS_SHORT_PL } from "@/lib/constants";
import type { Availability, User, Employee } from "@/types/database";

type AvailabilityWithEmployee = Availability & { employee: Employee & { user: User } };

export default function AvailabilityOverviewPage() {
  const { user } = useUser();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [availability, setAvailability] = useState<AvailabilityWithEmployee[]>([]);
  const [employees, setEmployees] = useState<(User & { employee: Employee | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      if (!user?.organization_id) return;
      const supabase = createClient();
      const startDate = weekDates[0];
      const endDate = weekDates[6];

      const [avRes, empRes] = await Promise.all([
        supabase
          .from("availability")
          .select("*, employee:employees(*, user:users(*))")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date"),
        supabase
          .from("users")
          .select("*, employee:employees(*)")
          .eq("organization_id", user.organization_id)
          .eq("role", "employee")
          .order("full_name"),
      ]);

      setAvailability((avRes.data as AvailabilityWithEmployee[]) ?? []);
      setEmployees((empRes.data as (User & { employee: Employee | null })[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user?.organization_id, weekStart]);

  const navigateWeek = (dir: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const getStatus = (employeeId: string, date: string) => {
    const entry = availability.find(
      (a) => a.employee_id === employeeId && a.date === date
    );
    return entry?.status || null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dostepnosc zespolu</h1>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
        </span>
        <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">Pracownik</th>
                {weekDates.map((date, i) => (
                  <th key={date} className="p-2 text-center font-medium">
                    <div>{DAYS_SHORT_PL[i]}</div>
                    <div className="text-xs text-muted-foreground">{date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b">
                  <td className="p-2">{emp.full_name}</td>
                  {weekDates.map((date) => {
                    const status = getStatus(emp.id, date);
                    const config = status ? AVAILABILITY_STATUS[status as keyof typeof AVAILABILITY_STATUS] : null;
                    return (
                      <td key={date} className="p-2 text-center">
                        {config ? (
                          <span className={`inline-block h-4 w-4 rounded-full ${config.color}`} title={config.label} />
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-full bg-gray-200" title="Nie zaznaczono" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        {Object.entries(AVAILABILITY_STATUS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-full ${val.color}`} />
            {val.label}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-200" />
          Nie zaznaczono
        </div>
      </div>
    </div>
  );
}
