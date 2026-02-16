"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime } from "@/lib/utils";
import type { Shift, Schedule } from "@/types/database";

interface EmployeeDashboardProps {
  userId: string;
}

export function EmployeeDashboard({ userId }: EmployeeDashboardProps) {
  const [upcomingShifts, setUpcomingShifts] = useState<(Shift & { schedule: Schedule })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data } = await supabase
        .from("shifts")
        .select("*, schedule:schedules(*)")
        .eq("employee_id", userId)
        .gte("date", today)
        .lte("date", nextMonth)
        .order("date")
        .order("start_time")
        .limit(10);

      setUpcomingShifts((data as (Shift & { schedule: Schedule })[]) ?? []);
      setLoading(false);
    }

    loadData();
  }, [userId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mój panel</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/my-availability">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Zaznacz dostępność</p>
                <p className="text-sm text-muted-foreground">Na kolejny tydzień</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/my-schedule">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Mój grafik</p>
                <p className="text-sm text-muted-foreground">Zobacz nadchodzące zmiany</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/my-swaps">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <ArrowLeftRight className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium">Zamień zmianę</p>
                <p className="text-sm text-muted-foreground">Poproś o zamianę</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nadchodzące zmiany</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Ładowanie...</p>
          ) : upcomingShifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak zaplanowanych zmian
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{formatDate(shift.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </p>
                  </div>
                  {shift.shift_type && (
                    <Badge variant="secondary">{shift.shift_type}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
