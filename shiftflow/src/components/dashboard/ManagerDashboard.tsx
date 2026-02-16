"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users, ArrowLeftRight, Clock, Plus, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

interface ManagerDashboardProps {
  user: User & { organization?: { id: string; name: string } };
}

export function ManagerDashboard({ user }: ManagerDashboardProps) {
  const [stats, setStats] = useState({
    employeeCount: 0,
    activeSchedules: 0,
    pendingSwaps: 0,
    pendingTimeOff: 0,
  });

  useEffect(() => {
    async function loadStats() {
      if (!user.organization_id) return;
      const supabase = createClient();

      const [employees, schedules, swaps, timeOff] = await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", user.organization_id)
          .eq("role", "employee"),
        supabase
          .from("schedules")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", user.organization_id)
          .in("status", ["draft", "published"]),
        supabase
          .from("swap_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("time_off_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setStats({
        employeeCount: employees.count ?? 0,
        activeSchedules: schedules.count ?? 0,
        pendingSwaps: swaps.count ?? 0,
        pendingTimeOff: timeOff.count ?? 0,
      });
    }

    loadStats();
  }, [user.organization_id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Witaj, {user.full_name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            {user.organization?.name ?? "Brak organizacji"}
          </p>
        </div>
        <Link href="/dashboard/schedules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nowy grafik
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pracownicy
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.employeeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktywne grafiki
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeSchedules}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Zamiany do akceptacji
            </CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingSwaps}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wnioski urlopowe
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingTimeOff}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/schedules/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Utwórz nowy grafik
              </Button>
            </Link>
            <Link href="/dashboard/employees" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Zarządzaj pracownikami
              </Button>
            </Link>
            <Link href="/dashboard/swaps" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Zamiany zmian
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Wymagające uwagi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingSwaps > 0 && (
              <p className="text-sm text-muted-foreground">
                {stats.pendingSwaps} zamian(y) oczekuje na akceptację
              </p>
            )}
            {stats.pendingTimeOff > 0 && (
              <p className="text-sm text-muted-foreground">
                {stats.pendingTimeOff} wniosków urlopowych do rozpatrzenia
              </p>
            )}
            {stats.pendingSwaps === 0 && stats.pendingTimeOff === 0 && (
              <p className="text-sm text-muted-foreground">
                Brak pilnych spraw
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
