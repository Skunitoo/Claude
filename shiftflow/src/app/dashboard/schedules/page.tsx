"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Eye, Pencil, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SCHEDULE_STATUS } from "@/lib/constants";
import type { Schedule } from "@/types/database";

export default function SchedulesPage() {
  const { user } = useUser();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.organization_id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("schedules")
        .select("*")
        .eq("organization_id", user.organization_id)
        .order("start_date", { ascending: false });
      setSchedules((data as Schedule[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user?.organization_id]);

  const archiveSchedule = async (id: string) => {
    const supabase = createClient();
    await supabase.from("schedules").update({ status: "archived" }).eq("id", id);
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: "archived" as const } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grafiki pracy</h1>
        <Link href="/dashboard/schedules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowy grafik
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nie masz jeszcze zadnych grafikow.</p>
            <Link href="/dashboard/schedules/new">
              <Button className="mt-4">Utworz pierwszy grafik</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{schedule.name || "Grafik bez nazwy"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={schedule.status === "published" ? "default" : "secondary"}
                  >
                    {SCHEDULE_STATUS[schedule.status]}
                  </Badge>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/schedules/${schedule.id}`}>
                      <Button variant="ghost" size="icon">
                        {schedule.status === "draft" ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </Link>
                    {schedule.status !== "archived" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => archiveSchedule(schedule.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
