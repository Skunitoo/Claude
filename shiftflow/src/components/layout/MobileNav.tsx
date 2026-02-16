"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/database";
import {
  Calendar,
  Users,
  LayoutDashboard,
  CalendarCheck,
  ArrowLeftRight,
  BarChart3,
  Clock,
  CalendarDays,
} from "lucide-react";

interface MobileNavProps {
  role: UserRole;
}

const managerLinks = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Pracownicy", icon: Users },
  { href: "/dashboard/schedules", label: "Grafiki", icon: Calendar },
  { href: "/dashboard/availability-overview", label: "Dostępność", icon: CalendarCheck },
  { href: "/dashboard/swaps", label: "Zamiany", icon: ArrowLeftRight },
  { href: "/dashboard/analytics", label: "Analityka", icon: BarChart3 },
];

const employeeLinks = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/my-schedule", label: "Grafik", icon: Calendar },
  { href: "/dashboard/my-availability", label: "Dostępność", icon: CalendarDays },
  { href: "/dashboard/my-swaps", label: "Zamiany", icon: ArrowLeftRight },
  { href: "/dashboard/my-time-off", label: "Urlopy", icon: Clock },
];

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const links = role === "employee" ? employeeLinks : managerLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {links.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
