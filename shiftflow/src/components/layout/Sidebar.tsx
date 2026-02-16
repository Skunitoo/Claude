"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  LayoutDashboard,
  CalendarCheck,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Clock,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/database";

interface SidebarProps {
  role: UserRole;
  userName: string;
  orgName?: string;
}

const managerLinks = [
  { href: "/dashboard", label: "Panel główny", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Pracownicy", icon: Users },
  { href: "/dashboard/schedules", label: "Grafiki", icon: Calendar },
  { href: "/dashboard/availability-overview", label: "Dostępność", icon: CalendarCheck },
  { href: "/dashboard/swaps", label: "Zamiany zmian", icon: ArrowLeftRight },
  { href: "/dashboard/time-off", label: "Urlopy", icon: Clock },
  { href: "/dashboard/analytics", label: "Analityka", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Ustawienia", icon: Settings },
];

const employeeLinks = [
  { href: "/dashboard", label: "Panel główny", icon: LayoutDashboard },
  { href: "/dashboard/my-schedule", label: "Mój grafik", icon: Calendar },
  { href: "/dashboard/my-availability", label: "Dostępność", icon: CalendarDays },
  { href: "/dashboard/my-swaps", label: "Zamiany zmian", icon: ArrowLeftRight },
  { href: "/dashboard/my-time-off", label: "Urlopy", icon: Clock },
];

export function Sidebar({ role, userName, orgName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "employee" ? employeeLinks : managerLinks;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">ShiftFlow</h1>
        {orgName && (
          <p className="mt-1 text-xs text-muted-foreground">{orgName}</p>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {role === "manager" ? "Kierownik" : role === "admin" ? "Admin" : "Pracownik"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/notifications" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Bell className="mr-1 h-3 w-3" />
              Powiadomienia
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
