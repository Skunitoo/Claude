"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime } from "@/lib/utils";
import { SWAP_STATUS } from "@/lib/constants";

interface SwapRequestRow {
  id: string;
  status: string;
  created_at: string;
  requester_shift: { date: string; start_time: string; end_time: string } | null;
  target_shift: { date: string; start_time: string; end_time: string } | null;
  requester: { user: { full_name: string } } | null;
  target: { user: { full_name: string } } | null;
  manager_notes: string | null;
}

export default function SwapsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SwapRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("swap_requests")
      .select(
        "*, requester:employees!requester_id(user:users(full_name)), target:employees!target_employee_id(user:users(full_name)), requester_shift:shifts!requester_shift_id(date, start_time, end_time), target_shift:shifts!target_shift_id(date, start_time, end_time)"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data as SwapRequestRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDecision = async (requestId: string, approved: boolean, notes?: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("swap_requests")
      .update({
        status: approved ? "accepted" : "rejected",
        manager_approved: approved,
        manager_notes: notes || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie przetworzyc wniosku", variant: "destructive" });
      return;
    }

    toast({ title: approved ? "Zaakceptowano" : "Odrzucono", description: "Wniosek o zamiane zostal przetworzony" });
    loadRequests();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zamiany zmian</h1>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Brak wnioskow o zamiane zmian</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={req.status === "pending" ? "secondary" : req.status === "accepted" ? "default" : "secondary"}
                      >
                        {SWAP_STATUS[req.status as keyof typeof SWAP_STATUS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(req.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">
                      <strong>{req.requester?.user?.full_name || "?"}</strong>
                      {" chce zamienic zmiane "}
                      {req.requester_shift && (
                        <span className="font-medium">
                          ({formatDate(req.requester_shift.date)}{" "}
                          {formatTime(req.requester_shift.start_time)}-
                          {formatTime(req.requester_shift.end_time)})
                        </span>
                      )}
                      {" z "}
                      <strong>{req.target?.user?.full_name || "?"}</strong>
                      {req.target_shift && (
                        <span className="font-medium">
                          {" "}({formatDate(req.target_shift.date)}{" "}
                          {formatTime(req.target_shift.start_time)}-
                          {formatTime(req.target_shift.end_time)})
                        </span>
                      )}
                    </p>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(req.id, true)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Akceptuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(req.id, false)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Odrzuc
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
