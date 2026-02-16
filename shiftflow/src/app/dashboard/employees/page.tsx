"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Upload, MoreVertical, UserX, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm";
import { BulkImportDialog } from "@/components/employees/BulkImportDialog";
import { getInitials, formatCurrency } from "@/lib/utils";
import type { User, Employee } from "@/types/database";

type EmployeeRow = User & { employee: Employee | null };

export default function EmployeesPage() {
  const { user } = useUser();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    if (!user?.organization_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*, employee:employees(*)")
      .eq("organization_id", user.organization_id)
      .eq("role", "employee")
      .order("full_name");

    setEmployees((data as EmployeeRow[]) ?? []);
    setLoading(false);
  }, [user?.organization_id]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const toggleActive = async (employeeId: string, currentActive: boolean) => {
    const supabase = createClient();
    await supabase
      .from("employees")
      .update({ is_active: !currentActive })
      .eq("id", employeeId);
    loadEmployees();
  };

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pracownicy</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj pracownika
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj pracownika..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ładowanie...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {employees.length === 0
                ? "Nie masz jeszcze pracowników. Dodaj pierwszego!"
                : "Brak wyników wyszukiwania"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarFallback>{getInitials(emp.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{emp.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                  {emp.phone && (
                    <p className="text-xs text-muted-foreground">{emp.phone}</p>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {emp.employee?.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="hidden md:block text-right">
                  {emp.employee?.hourly_rate && (
                    <p className="text-sm font-medium">
                      {formatCurrency(emp.employee.hourly_rate)}/h
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    max {emp.employee?.max_hours_per_week ?? 40}h/tyg
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={emp.employee?.is_active !== false ? "default" : "secondary"}
                  >
                    {emp.employee?.is_active !== false ? "Aktywny" : "Nieaktywny"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleActive(emp.id, emp.employee?.is_active !== false)
                    }
                    title={
                      emp.employee?.is_active !== false ? "Dezaktywuj" : "Aktywuj"
                    }
                  >
                    {emp.employee?.is_active !== false ? (
                      <UserX className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj pracownika</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm
            organizationId={user?.organization_id ?? ""}
            onSuccess={() => {
              setShowAdd(false);
              loadEmployees();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import pracowników z CSV</DialogTitle>
          </DialogHeader>
          <BulkImportDialog
            organizationId={user?.organization_id ?? ""}
            onSuccess={() => {
              setShowImport(false);
              loadEmployees();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
