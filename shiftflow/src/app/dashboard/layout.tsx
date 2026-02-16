"use client";

import { useUser } from "@/hooks/useUser";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-32" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar
          role={user.role}
          userName={user.full_name}
          orgName={user.organization?.name}
        />
      </div>
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      <MobileNav role={user.role} />
    </div>
  );
}
