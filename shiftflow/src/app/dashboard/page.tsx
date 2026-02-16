"use client";

import { useUser } from "@/hooks/useUser";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";

export default function DashboardPage() {
  const { user } = useUser();

  if (!user) return null;

  if (user.role === "employee") {
    return <EmployeeDashboard userId={user.id} />;
  }

  return <ManagerDashboard user={user} />;
}
