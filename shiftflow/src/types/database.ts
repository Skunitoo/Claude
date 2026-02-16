export type UserRole = "admin" | "manager" | "employee";
export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type Industry = "restaurant" | "retail" | "salon" | "other";
export type AvailabilityStatus = "available" | "prefer_not" | "unavailable";
export type ScheduleStatus = "draft" | "published" | "archived";
export type ShiftType = "morning" | "evening" | "night";
export type SwapRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type TimeOffType = "vacation" | "sick_leave" | "personal" | "unpaid";
export type RequestStatus = "pending" | "approved" | "rejected";
export type NotificationType = "sms" | "email" | "push";

export interface Organization {
  id: string;
  name: string;
  industry: Industry | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  organization_id: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface Employee {
  id: string;
  hourly_rate: number | null;
  skills: string[];
  employment_start_date: string | null;
  is_active: boolean;
  max_hours_per_week: number;
  preferred_shift_types: ShiftType[];
}

export interface EmployeeWithUser extends Employee {
  user: User;
}

export interface Availability {
  id: string;
  employee_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: AvailabilityStatus;
  is_recurring: boolean;
  recurrence_rule: Record<string, unknown> | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  organization_id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: ScheduleStatus;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  schedule_id: string;
  employee_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  shift_type: ShiftType | null;
  required_skills: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftWithEmployee extends Shift {
  employee?: EmployeeWithUser | null;
}

export interface SwapRequest {
  id: string;
  requester_shift_id: string;
  target_shift_id: string | null;
  requester_id: string;
  target_employee_id: string | null;
  status: SwapRequestStatus;
  manager_approved: boolean | null;
  manager_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  reason: string | null;
  approved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  subject: string | null;
  message: string;
  sent_at: string;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BusinessRule {
  id: string;
  organization_id: string;
  rule_type: string;
  rule_value: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}
