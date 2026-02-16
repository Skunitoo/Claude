"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Save,
  Send,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime } from "@/lib/utils";
import { SHIFT_TYPES, DAYS_SHORT_PL, SCHEDULE_STATUS } from "@/lib/constants";
import { validateAllEmployees, type LaborLawViolation } from "@/lib/labor-law";
import type { Schedule, Shift, User, Employee } from "@/types/database";

type EmployeeRow = User & { employee: Employee | null };

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [shifts, setShifts] = useState<(Shift & { employee?: EmployeeRow | null })[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [violations, setViolations] = useState<LaborLawViolation[]>([]);
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // New shift form state
  const [newShift, setNewShift] = useState({
    employeeId: "",
    date: "",
    startTime: "08:00",
    endTime: "16:00",
    breakMinutes: "30",
    shiftType: "morning",
  });

  const loadData = useCallback(async () => {
    if (!user?.organization_id) return;
    const supabase = createClient();

    const [scheduleRes, shiftsRes, empRes] = await Promise.all([
      supabase.from("schedules").select("*").eq("id", id).single(),
      supabase
        .from("shifts")
        .select("*")
        .eq("schedule_id", id)
        .order("date")
        .order("start_time"),
      supabase
        .from("users")
        .select("*, employee:employees(*)")
        .eq("organization_id", user.organization_id)
        .eq("role", "employee")
        .order("full_name"),
    ]);

    if (scheduleRes.data) setSchedule(scheduleRes.data as Schedule);
    if (shiftsRes.data) setShifts(shiftsRes.data as Shift[]);
    if (empRes.data) setEmployees(empRes.data as EmployeeRow[]);
    setLoading(false);
  }, [id, user?.organization_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (shifts.length > 0) {
      setViolations(validateAllEmployees(shifts as Shift[]));
    }
  }, [shifts]);

  const getDatesInRange = (): string[] => {
    if (!schedule) return [];
    const dates: string[] = [];
    const start = new Date(schedule.start_date);
    const end = new Date(schedule.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const dates = getDatesInRange();
  const getDayName = (date: string) => {
    const d = new Date(date);
    return DAYS_SHORT_PL[d.getDay() === 0 ? 6 : d.getDay() - 1];
  };

  const addShift = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        schedule_id: id,
        employee_id: newShift.employeeId || null,
        date: newShift.date || selectedDate,
        start_time: newShift.startTime,
        end_time: newShift.endTime,
        break_duration_minutes: parseInt(newShift.breakMinutes) || 0,
        shift_type: newShift.shiftType || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie dodac zmiany", variant: "destructive" });
      return;
    }

    setShifts((prev) => [...prev, data as Shift]);
    setShowAddShift(false);
    setNewShift({ employeeId: "", date: "", startTime: "08:00", endTime: "16:00", breakMinutes: "30", shiftType: "morning" });
  };

  const deleteShift = async (shiftId: string) => {
    const supabase = createClient();
    await supabase.from("shifts").delete().eq("id", shiftId);
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  const publishSchedule = async () => {
    if (violations.filter((v) => v.severity === "error").length > 0) {
      toast({ title: "Blad", description: "Nie mozna opublikowac grafiku z naruszeniami prawa pracy", variant: "destructive" });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("schedules")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie opublikowac grafiku", variant: "destructive" });
      return;
    }

    setSchedule((prev) => prev ? { ...prev, status: "published" } : prev);
    toast({ title: "Opublikowano", description: "Grafik zostal opublikowany. Pracownicy zostana powiadomieni." });
  };

  if (loading) return <p className="text-muted-foreground">Ladowanie...</p>;
  if (!schedule) return <p className="text-destructive">Nie znaleziono grafiku</p>;

  const getEmployeeName = (empId: string | null) => {
    if (!empId) return "Nieprzypisany";
    return employees.find((e) => e.id === empId)?.full_name || "Nieznany";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/schedules")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{schedule.name || "Grafik"}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(schedule.start_date)} - {formatDate(schedule.end_date)}
            </p>
          </div>
          <Badge variant={schedule.status === "published" ? "default" : "secondary"}>
            {SCHEDULE_STATUS[schedule.status]}
          </Badge>
        </div>
        <div className="flex gap-2">
          {schedule.status === "draft" && (
            <>
              <Button variant="outline" onClick={publishSchedule}>
                <Send className="mr-2 h-4 w-4" />
                Opublikuj
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Naruszenia prawa pracy ({violations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {violations.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={v.severity === "error" ? "text-red-600" : "text-yellow-700"}>
                    {v.severity === "error" ? "!!!" : "!"}
                  </span>
                  <span className="text-yellow-800">
                    {v.employeeId && <strong>{getEmployeeName(v.employeeId)}: </strong>}
                    {v.message}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Schedule grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 text-sm font-medium text-muted-foreground">Pracownik</div>
            {dates.slice(0, 7).map((date) => (
              <div key={date} className="p-2 text-center text-sm">
                <p className="font-medium">{getDayName(date)}</p>
                <p className="text-xs text-muted-foreground">{date.slice(5)}</p>
              </div>
            ))}
          </div>
          {employees.map((emp) => (
            <div key={emp.id} className="grid grid-cols-8 gap-1">
              <div className="flex items-center p-2 text-sm truncate">{emp.full_name}</div>
              {dates.slice(0, 7).map((date) => {
                const dayShifts = shifts.filter(
                  (s) => s.employee_id === emp.id && s.date === date
                );
                return (
                  <div key={date} className="min-h-[60px] rounded border bg-muted/30 p-1">
                    {dayShifts.map((shift) => {
                      const type = shift.shift_type as keyof typeof SHIFT_TYPES;
                      const color = type && SHIFT_TYPES[type] ? SHIFT_TYPES[type].color : "bg-gray-100 text-gray-800";
                      return (
                        <div
                          key={shift.id}
                          className={`group relative mb-1 rounded px-1.5 py-0.5 text-xs ${color}`}
                        >
                          {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                          {schedule.status === "draft" && (
                            <button
                              onClick={() => deleteShift(shift.id)}
                              className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {schedule.status === "draft" && (
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setNewShift((prev) => ({ ...prev, date, employeeId: emp.id }));
                          setShowAddShift(true);
                        }}
                        className="w-full rounded border border-dashed border-muted-foreground/30 p-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="mx-auto h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {/* Unassigned shifts row */}
          <div className="grid grid-cols-8 gap-1">
            <div className="flex items-center p-2 text-sm italic text-muted-foreground">Nieprzypisane</div>
            {dates.slice(0, 7).map((date) => {
              const dayShifts = shifts.filter(
                (s) => !s.employee_id && s.date === date
              );
              return (
                <div key={date} className="min-h-[60px] rounded border border-dashed bg-muted/10 p-1">
                  {dayShifts.map((shift) => (
                    <div key={shift.id} className="group relative mb-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                      {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                      {schedule.status === "draft" && (
                        <button
                          onClick={() => deleteShift(shift.id)}
                          className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {schedule.status === "draft" && (
                    <button
                      onClick={() => {
                        setSelectedDate(date);
                        setNewShift((prev) => ({ ...prev, date, employeeId: "" }));
                        setShowAddShift(true);
                      }}
                      className="w-full rounded border border-dashed border-muted-foreground/30 p-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="mx-auto h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add shift dialog */}
      <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj zmiane - {selectedDate && formatDate(selectedDate)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pracownik</Label>
              <Select
                options={[
                  { value: "", label: "-- Nieprzypisany --" },
                  ...employees.map((e) => ({ value: e.id, label: e.full_name })),
                ]}
                value={newShift.employeeId}
                onChange={(e) => setNewShift((prev) => ({ ...prev, employeeId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Typ zmiany</Label>
              <Select
                options={Object.entries(SHIFT_TYPES).map(([key, val]) => ({
                  value: key,
                  label: `${val.label} (${val.start}-${val.end})`,
                }))}
                value={newShift.shiftType}
                onChange={(e) => {
                  const type = e.target.value as keyof typeof SHIFT_TYPES;
                  setNewShift((prev) => ({
                    ...prev,
                    shiftType: type,
                    startTime: SHIFT_TYPES[type].start,
                    endTime: SHIFT_TYPES[type].end,
                  }));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Poczatek</Label>
                <Input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Koniec</Label>
                <Input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Przerwa (minuty)</Label>
              <Input
                type="number"
                value={newShift.breakMinutes}
                onChange={(e) => setNewShift((prev) => ({ ...prev, breakMinutes: e.target.value }))}
              />
            </div>
            <Button onClick={addShift} className="w-full">
              Dodaj zmiane
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
