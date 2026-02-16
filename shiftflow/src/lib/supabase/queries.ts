import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  User,
  Organization,
  Employee,
  EmployeeWithUser,
  Schedule,
  Shift,
  ShiftWithEmployee,
  Availability,
  SwapRequest,
  TimeOffRequest,
  Notification,
} from "@/types/database";

// User queries
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*, organization:organizations(*)")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as User & { organization: Organization | null };
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<User>
) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// Organization queries
export async function createOrganization(
  supabase: SupabaseClient,
  org: { name: string; industry?: string }
) {
  const { data, error } = await supabase
    .from("organizations")
    .insert(org)
    .select()
    .single();

  if (error) throw error;
  return data as Organization;
}

export async function getOrganization(supabase: SupabaseClient, orgId: string) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) throw error;
  return data as Organization;
}

// Employee queries
export async function getEmployees(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*, employee:employees(*)")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .order("full_name");

  if (error) throw error;
  return data as (User & { employee: Employee | null })[];
}

export async function getEmployeeWithUser(supabase: SupabaseClient, employeeId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*, user:users(*)")
    .eq("id", employeeId)
    .single();

  if (error) throw error;
  return data as Employee & { user: User };
}

export async function createEmployee(
  supabase: SupabaseClient,
  user: { email: string; full_name: string; phone?: string; organization_id: string; role: string },
  employee: { hourly_rate?: number; skills?: string[]; max_hours_per_week?: number }
) {
  // First create user
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert(user)
    .select()
    .single();

  if (userError) throw userError;

  // Then create employee record
  const { data: empData, error: empError } = await supabase
    .from("employees")
    .insert({ id: userData.id, ...employee })
    .select()
    .single();

  if (empError) throw empError;

  return { user: userData as User, employee: empData as Employee };
}

export async function updateEmployee(
  supabase: SupabaseClient,
  employeeId: string,
  userUpdates: Partial<User>,
  employeeUpdates: Partial<Employee>
) {
  const results = await Promise.all([
    supabase.from("users").update(userUpdates).eq("id", employeeId),
    supabase.from("employees").update(employeeUpdates).eq("id", employeeId),
  ]);

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) throw errors[0].error;
}

export async function toggleEmployeeActive(
  supabase: SupabaseClient,
  employeeId: string,
  isActive: boolean
) {
  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", employeeId);

  if (error) throw error;
}

// Schedule queries
export async function getSchedules(supabase: SupabaseClient, organizationId: string) {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data as Schedule[];
}

export async function getSchedule(supabase: SupabaseClient, scheduleId: string) {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function createSchedule(
  supabase: SupabaseClient,
  schedule: {
    organization_id: string;
    name: string;
    start_date: string;
    end_date: string;
    created_by: string;
  }
) {
  const { data, error } = await supabase
    .from("schedules")
    .insert(schedule)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function publishSchedule(supabase: SupabaseClient, scheduleId: string) {
  const { data, error } = await supabase
    .from("schedules")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

// Shift queries
export async function getShiftsForSchedule(supabase: SupabaseClient, scheduleId: string) {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, employee:employees(*, user:users(*))")
    .eq("schedule_id", scheduleId)
    .order("date")
    .order("start_time");

  if (error) throw error;
  return data as ShiftWithEmployee[];
}

export async function getEmployeeShifts(
  supabase: SupabaseClient,
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, schedule:schedules(*)")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date")
    .order("start_time");

  if (error) throw error;
  return data as (Shift & { schedule: Schedule })[];
}

export async function createShift(
  supabase: SupabaseClient,
  shift: {
    schedule_id: string;
    employee_id?: string;
    date: string;
    start_time: string;
    end_time: string;
    break_duration_minutes?: number;
    shift_type?: string;
    required_skills?: string[];
    notes?: string;
  }
) {
  const { data, error } = await supabase
    .from("shifts")
    .insert(shift)
    .select()
    .single();

  if (error) throw error;
  return data as Shift;
}

export async function updateShift(
  supabase: SupabaseClient,
  shiftId: string,
  updates: Partial<Shift>
) {
  const { data, error } = await supabase
    .from("shifts")
    .update(updates)
    .eq("id", shiftId)
    .select()
    .single();

  if (error) throw error;
  return data as Shift;
}

export async function deleteShift(supabase: SupabaseClient, shiftId: string) {
  const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
  if (error) throw error;
}

// Availability queries
export async function getAvailability(
  supabase: SupabaseClient,
  employeeId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) throw error;
  return data as Availability[];
}

export async function getTeamAvailability(
  supabase: SupabaseClient,
  organizationId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("availability")
    .select("*, employee:employees(*, user:users(*))")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) throw error;
  return data as (Availability & { employee: Employee & { user: User } })[];
}

export async function setAvailability(
  supabase: SupabaseClient,
  availability: {
    employee_id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    status: string;
    is_recurring?: boolean;
  }
) {
  const { data, error } = await supabase
    .from("availability")
    .upsert(availability, { onConflict: "employee_id,date,start_time" })
    .select()
    .single();

  if (error) throw error;
  return data as Availability;
}

// Swap request queries
export async function getSwapRequests(
  supabase: SupabaseClient,
  organizationId: string,
  status?: string
) {
  let query = supabase
    .from("swap_requests")
    .select(
      "*, requester:employees!requester_id(*, user:users(*)), target:employees!target_employee_id(*, user:users(*)), requester_shift:shifts!requester_shift_id(*), target_shift:shifts!target_shift_id(*)"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createSwapRequest(
  supabase: SupabaseClient,
  request: {
    requester_shift_id: string;
    target_shift_id?: string;
    requester_id: string;
    target_employee_id: string;
  }
) {
  const { data, error } = await supabase
    .from("swap_requests")
    .insert(request)
    .select()
    .single();

  if (error) throw error;
  return data as SwapRequest;
}

export async function updateSwapRequest(
  supabase: SupabaseClient,
  requestId: string,
  updates: Partial<SwapRequest>
) {
  const { data, error } = await supabase
    .from("swap_requests")
    .update({ ...updates, resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw error;
  return data as SwapRequest;
}

// Time off queries
export async function getTimeOffRequests(
  supabase: SupabaseClient,
  employeeId?: string,
  status?: string
) {
  let query = supabase
    .from("time_off_requests")
    .select("*, employee:employees(*, user:users(*))")
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTimeOffRequest(
  supabase: SupabaseClient,
  request: {
    employee_id: string;
    type: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }
) {
  const { data, error } = await supabase
    .from("time_off_requests")
    .insert(request)
    .select()
    .single();

  if (error) throw error;
  return data as TimeOffRequest;
}

// Notification queries
export async function getNotifications(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(supabase: SupabaseClient, notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw error;
}
