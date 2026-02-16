"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { AVAILABILITY_STATUS, DAYS_SHORT_PL } from "@/lib/constants";
import type { Availability, AvailabilityStatus } from "@/types/database";

export default function MyAvailabilityPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [availability, setAvailability] = useState<Map<string, AvailabilityStatus>>(new Map());
  const [saving, setSaving] = useState(false);

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
        .from("availability")
        .select("*")
        .eq("employee_id", user.id)
        .gte("date", weekDates[0])
        .lte("date", weekDates[6]);

      const map = new Map<string, AvailabilityStatus>();
      (data as Availability[] | null)?.forEach((a) => map.set(a.date, a.status));
      setAvailability(map);
    }
    load();
  }, [user, weekStart]);

  const toggleStatus = (date: string) => {
    setAvailability((prev) => {
      const map = new Map(prev);
      const current = map.get(date);
      const statuses: AvailabilityStatus[] = ["available", "prefer_not", "unavailable"];
      const nextIdx = current ? (statuses.indexOf(current) + 1) % statuses.length : 0;
      map.set(date, statuses[nextIdx]);
      return map;
    });
  };

  const saveAvailability = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    const entries = Array.from(availability.entries()).map(([date, status]) => ({
      employee_id: user.id,
      date,
      status,
      is_recurring: false,
    }));

    for (const entry of entries) {
      await supabase
        .from("availability")
        .upsert(entry, { onConflict: "employee_id,date" });
    }

    toast({ title: "Zapisano", description: "Twoja dostepnosc zostala zaktualizowana" });
    setSaving(false);
  };

  const navigateWeek = (dir: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moja dostepnosc</h1>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kliknij dzien aby zmienic status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => {
              const status = availability.get(date);
              const config = status ? AVAILABILITY_STATUS[status] : null;
              const isWeekend = i >= 5;
              return (
                <button
                  key={date}
                  onClick={() => toggleStatus(date)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                    config ? `border-2` : "border-dashed"
                  } ${isWeekend ? "bg-muted/50" : ""}`}
                >
                  <span className="text-xs font-medium">{DAYS_SHORT_PL[i]}</span>
                  <span className="text-xs text-muted-foreground">{date.slice(5)}</span>
                  <span
                    className={`h-8 w-8 rounded-full ${config?.color || "bg-gray-200"}`}
                  />
                  <span className={`text-xs ${config?.textColor || "text-muted-foreground"}`}>
                    {config?.label || "Kliknij"}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveAvailability} disabled={saving} className="w-full">
        {saving ? "Zapisywanie..." : "Zapisz dostepnosc"}
      </Button>

      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        {Object.entries(AVAILABILITY_STATUS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-full ${val.color}`} />
            {val.label}
          </div>
        ))}
      </div>
    </div>
  );
}
