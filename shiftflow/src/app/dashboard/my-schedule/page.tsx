"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { SHIFT_TYPES, DAYS_SHORT_PL } from "@/lib/constants";
import type { Shift, Schedule } from "@/types/database";

export default function MySchedulePage() {
  const { user } = useUser();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [shifts, setShifts] = useState<(Shift & { schedule: Schedule })[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("shifts")
        .select("*, schedule:schedules(*)")
        .eq("employee_id", user.id)
        .gte("date", weekDates[0])
        .lte("date", weekDates[6])
        .order("date")
        .order("start_time");
      setShifts((data as (Shift & { schedule: Schedule })[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user, weekStart]);

  const navigateWeek = (dir: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const totalHours = shifts.reduce((sum, shift) => {
    let start = 0, end = 0;
    const [sh, sm] = shift.start_time.split(":").map(Number);
    const [eh, em] = shift.end_time.split(":").map(Number);
    start = sh * 60 + (sm || 0);
    end = eh * 60 + (em || 0);
    if (end <= start) end += 24 * 60;
    return sum + (end - start - shift.break_duration_minutes) / 60;
  }, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moj grafik</h1>

      <div className="flex items-center justify-between">
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
        <Badge variant="secondary">{totalHours.toFixed(1)}h w tym tygodniu</Badge>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : (
        <div className="grid gap-2">
          {weekDates.map((date, i) => {
            const dayShifts = shifts.filter((s) => s.date === date);
            const isToday = date === new Date().toISOString().split("T")[0];
            const isWeekend = i >= 5;

            return (
              <Card key={date} className={isToday ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-center ${isWeekend ? "text-muted-foreground" : ""}`}>
                        <p className="text-xs font-medium">{DAYS_SHORT_PL[i]}</p>
                        <p className="text-lg font-bold">{date.slice(8)}</p>
                      </div>
                      <div>
                        {dayShifts.length > 0 ? (
                          dayShifts.map((shift) => {
                            const type = shift.shift_type as keyof typeof SHIFT_TYPES;
                            const typeConfig = type && SHIFT_TYPES[type] ? SHIFT_TYPES[type] : null;
                            return (
                              <div key={shift.id} className="flex items-center gap-2">
                                <span className="font-medium">
                                  {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                </span>
                                {typeConfig && (
                                  <span className={`rounded px-2 py-0.5 text-xs ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </span>
                                )}
                                {shift.notes && (
                                  <span className="text-xs text-muted-foreground">{shift.notes}</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">Wolne</p>
                        )}
                      </div>
                    </div>
                    {isToday && (
                      <Badge>Dzisiaj</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
