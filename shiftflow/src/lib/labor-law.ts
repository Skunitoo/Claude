import type { Shift } from "@/types/database";

export interface LaborLawViolation {
  type: string;
  message: string;
  severity: "error" | "warning";
  shiftId?: string;
  employeeId?: string;
}

// Polish labor law constants
const MAX_DAILY_HOURS = 12; // Art. 129 KP - max in equal time system
const MIN_DAILY_REST = 11; // Art. 132 KP - 11 hours uninterrupted rest
const MIN_WEEKLY_REST = 35; // Art. 133 KP - 35 hours uninterrupted rest
const MAX_WEEKLY_HOURS = 48; // Art. 131 KP - including overtime
const MAX_OVERTIME_YEARLY = 150; // Art. 151 KP
const MAX_NIGHT_HOURS = 8; // Art. 1517 KP

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function shiftDurationMinutes(shift: Shift): number {
  let start = parseTime(shift.start_time);
  let end = parseTime(shift.end_time);
  if (end <= start) end += 24 * 60; // overnight shift
  return end - start - shift.break_duration_minutes;
}

function shiftEndDateTime(shift: Shift): Date {
  const date = new Date(shift.date);
  const [h, m] = shift.end_time.split(":").map(Number);
  date.setHours(h, m || 0, 0, 0);
  if (parseTime(shift.end_time) <= parseTime(shift.start_time)) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function shiftStartDateTime(shift: Shift): Date {
  const date = new Date(shift.date);
  const [h, m] = shift.start_time.split(":").map(Number);
  date.setHours(h, m || 0, 0, 0);
  return date;
}

export function validateShifts(
  shifts: Shift[],
  employeeId: string
): LaborLawViolation[] {
  const violations: LaborLawViolation[] = [];
  const employeeShifts = shifts
    .filter((s) => s.employee_id === employeeId)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.start_time.localeCompare(b.start_time);
    });

  if (employeeShifts.length === 0) return violations;

  for (const shift of employeeShifts) {
    // Check max daily hours
    const duration = shiftDurationMinutes(shift) / 60;
    if (duration > MAX_DAILY_HOURS) {
      violations.push({
        type: "max_daily_hours",
        message: `Zmiana przekracza ${MAX_DAILY_HOURS}h (${duration.toFixed(1)}h). Art. 129 KP.`,
        severity: "error",
        shiftId: shift.id,
        employeeId,
      });
    }

    // Check night shift max hours
    if (shift.shift_type === "night" && duration > MAX_NIGHT_HOURS) {
      violations.push({
        type: "max_night_hours",
        message: `Zmiana nocna przekracza ${MAX_NIGHT_HOURS}h. Art. 1517 KP.`,
        severity: "error",
        shiftId: shift.id,
        employeeId,
      });
    }
  }

  // Check rest between shifts (11h minimum)
  for (let i = 0; i < employeeShifts.length - 1; i++) {
    const endTime = shiftEndDateTime(employeeShifts[i]);
    const nextStartTime = shiftStartDateTime(employeeShifts[i + 1]);
    const restHours = (nextStartTime.getTime() - endTime.getTime()) / (1000 * 60 * 60);

    if (restHours < MIN_DAILY_REST && restHours >= 0) {
      violations.push({
        type: "min_daily_rest",
        message: `Przerwa miedzy zmianami to ${restHours.toFixed(1)}h (min. ${MIN_DAILY_REST}h). Art. 132 KP.`,
        severity: "error",
        shiftId: employeeShifts[i + 1].id,
        employeeId,
      });
    }
  }

  // Check weekly hours (group by ISO week)
  const weeklyHours = new Map<string, number>();
  for (const shift of employeeShifts) {
    const date = new Date(shift.date);
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekKey = `${date.getFullYear()}-W${Math.ceil(dayOfYear / 7)}`;
    const current = weeklyHours.get(weekKey) || 0;
    weeklyHours.set(weekKey, current + shiftDurationMinutes(shift) / 60);
  }

  for (const [week, hours] of weeklyHours) {
    if (hours > MAX_WEEKLY_HOURS) {
      violations.push({
        type: "max_weekly_hours",
        message: `Tydzien ${week}: ${hours.toFixed(1)}h przekracza limit ${MAX_WEEKLY_HOURS}h/tydzien. Art. 131 KP.`,
        severity: "error",
        employeeId,
      });
    }
  }

  // Check weekly rest (35h uninterrupted rest in each 7-day period)
  const dates = [...new Set(employeeShifts.map((s) => s.date))].sort();
  if (dates.length >= 7) {
    for (let i = 0; i <= dates.length - 7; i++) {
      const weekStart = new Date(dates[i]);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekShifts = employeeShifts.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      });

      if (weekShifts.length === 7) {
        violations.push({
          type: "min_weekly_rest",
          message: `Brak dnia wolnego w tygodniu ${dates[i]}. Wymagane min. ${MIN_WEEKLY_REST}h odpoczynku. Art. 133 KP.`,
          severity: "warning",
          employeeId,
        });
      }
    }
  }

  return violations;
}

export function validateAllEmployees(shifts: Shift[]): LaborLawViolation[] {
  const employeeIds = [...new Set(shifts.filter((s) => s.employee_id).map((s) => s.employee_id!))];
  return employeeIds.flatMap((id) => validateShifts(shifts, id));
}
