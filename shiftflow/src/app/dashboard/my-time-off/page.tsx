"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { TIME_OFF_TYPES } from "@/lib/constants";

interface TimeOffRow {
  id: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export default function MyTimeOffPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TimeOffRow[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("time_off_requests")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });
      setRequests((data as TimeOffRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const submitRequest = async () => {
    if (!user || !form.startDate || !form.endDate) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("time_off_requests")
      .insert({
        employee_id: user.id,
        type: form.type,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie wyslac wniosku", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setRequests((prev) => [data as TimeOffRow, ...prev]);
    toast({ title: "Wyslano", description: "Wniosek urlopowy zostal wyslany" });
    setShowNew(false);
    setForm({ type: "vacation", startDate: "", endDate: "", reason: "" });
    setSubmitting(false);
  };

  const statusLabels: Record<string, string> = {
    pending: "Oczekujacy",
    approved: "Zatwierdzony",
    rejected: "Odrzucony",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moje urlopy</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy wniosek
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Nie masz jeszcze zadnych wnioskow urlopowych</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={req.status === "approved" ? "default" : "secondary"}>
                      {statusLabels[req.status]}
                    </Badge>
                    <Badge variant="secondary">
                      {TIME_OFF_TYPES[req.type as keyof typeof TIME_OFF_TYPES]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(req.start_date)} - {formatDate(req.end_date)}
                  </p>
                  {req.reason && <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy wniosek urlopowy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                options={Object.entries(TIME_OFF_TYPES).map(([k, v]) => ({ value: k, label: v }))}
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Od</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Do</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Powod (opcjonalnie)</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Dodatkowe informacje..."
              />
            </div>
            <Button onClick={submitRequest} disabled={submitting || !form.startDate || !form.endDate} className="w-full">
              {submitting ? "Wysylanie..." : "Wyslij wniosek"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
