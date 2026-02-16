"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime } from "@/lib/utils";
import { SWAP_STATUS } from "@/lib/constants";
import type { Shift, Schedule } from "@/types/database";

interface SwapRow {
  id: string;
  status: string;
  created_at: string;
  requester_shift: { date: string; start_time: string; end_time: string } | null;
  target_shift: { date: string; start_time: string; end_time: string } | null;
  target: { user: { full_name: string } } | null;
}

export default function MySwapsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SwapRow[]>([]);
  const [myShifts, setMyShifts] = useState<(Shift & { schedule: Schedule })[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedShift, setSelectedShift] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const [swapRes, shiftsRes] = await Promise.all([
        supabase
          .from("swap_requests")
          .select(
            "*, target:employees!target_employee_id(user:users(full_name)), requester_shift:shifts!requester_shift_id(date, start_time, end_time), target_shift:shifts!target_shift_id(date, start_time, end_time)"
          )
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("shifts")
          .select("*, schedule:schedules(*)")
          .eq("employee_id", user.id)
          .gte("date", today)
          .order("date")
          .order("start_time"),
      ]);

      setRequests((swapRes.data as SwapRow[]) ?? []);
      setMyShifts((shiftsRes.data as (Shift & { schedule: Schedule })[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const createRequest = async () => {
    if (!user || !selectedShift) return;
    const supabase = createClient();
    const { error } = await supabase.from("swap_requests").insert({
      requester_shift_id: selectedShift,
      requester_id: user.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie utworzyc wniosku", variant: "destructive" });
      return;
    }

    toast({ title: "Wyslano", description: "Wniosek o zamiane zostal wyslany" });
    setShowNew(false);
    setSelectedShift("");
  };

  const cancelRequest = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("swap_requests")
      .update({ status: "cancelled", resolved_at: new Date().toISOString() })
      .eq("id", id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moje zamiany</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowa zamiana
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Nie masz jeszcze zadnych wnioskow o zamiane</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={req.status === "accepted" ? "default" : "secondary"}
                    >
                      {SWAP_STATUS[req.status as keyof typeof SWAP_STATUS]}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    Zmiana:{" "}
                    {req.requester_shift
                      ? `${formatDate(req.requester_shift.date)} ${formatTime(req.requester_shift.start_time)}-${formatTime(req.requester_shift.end_time)}`
                      : "?"}
                  </p>
                </div>
                {req.status === "pending" && (
                  <Button variant="ghost" size="sm" onClick={() => cancelRequest(req.id)}>
                    <X className="mr-1 h-3 w-3" /> Anuluj
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy wniosek o zamiane</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ktora zmiane chcesz zamienic?</Label>
              {myShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak nadchodzacych zmian</p>
              ) : (
                <Select
                  options={myShifts.map((s) => ({
                    value: s.id,
                    label: `${formatDate(s.date)} ${formatTime(s.start_time)}-${formatTime(s.end_time)}`,
                  }))}
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  placeholder="Wybierz zmiane"
                />
              )}
            </div>
            <Button onClick={createRequest} disabled={!selectedShift} className="w-full">
              Wyslij wniosek
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
