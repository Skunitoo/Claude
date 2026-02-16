import type { Shift, ShiftWithEmployee, Employee, EmployeeWithUser } from "./database";

export interface ScheduleGridCell {
  date: string;
  employeeId: string;
  shifts: ShiftWithEmployee[];
}

export interface ScheduleGrid {
  dates: string[];
  employees: EmployeeWithUser[];
  cells: Map<string, ScheduleGridCell>;
}

export interface DragItem {
  type: "shift" | "template";
  shift?: Shift;
  templateType?: string;
}

export interface DropTarget {
  date: string;
  employeeId: string;
}

export interface LaborLawViolation {
  type: "MAX_HOURS" | "MIN_BREAK" | "MIN_REST" | "MAX_CONSECUTIVE_DAYS";
  severity: "error" | "warning";
  message: string;
  employeeId: string;
  affectedShifts: string[];
}

export interface ScheduleConflict {
  type: "unavailable" | "max_hours" | "overlap" | "missing_skill";
  severity: "error" | "warning";
  message: string;
  employeeId: string;
  shiftId?: string;
}

export interface ShiftTemplate {
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  shift_type: string;
  required_skills: string[];
}
