"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  employee: { user: { full_name: string } } | null;
}

export default function TimeOffPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TimeOffRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("time_off_requests")
      .select("*, employee:employees(user:users(full_name))")
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data as TimeOffRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDecision = async (requestId: string, approved: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        status: approved ? "approved" : "rejected",
        approved_by: approved ? user?.id : null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie przetworzyc wniosku", variant: "destructive" });
      return;
    }

    toast({ title: approved ? "Zatwierdzono" : "Odrzucono", description: "Wniosek urlopowy zostal przetworzony" });
    loadRequests();
  };

  const statusColors: Record<string, string> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Oczekujacy",
    approved: "Zatwierdzony",
    rejected: "Odrzucony",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wnioski urlopowe</h1>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Brak wnioskow urlopowych</p>
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
                      <Badge variant={statusColors[req.status] as "default" | "secondary" | "destructive"}>
                        {statusLabels[req.status]}
                      </Badge>
                      <Badge variant="secondary">
                        {TIME_OFF_TYPES[req.type as keyof typeof TIME_OFF_TYPES] || req.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {req.employee?.user?.full_name || "?"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(req.start_date)} - {formatDate(req.end_date)}
                    </p>
                    {req.reason && (
                      <p className="mt-1 text-xs text-muted-foreground">Powod: {req.reason}</p>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleDecision(req.id, true)}>
                        <Check className="mr-1 h-3 w-3" />
                        Zatwierdz
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecision(req.id, false)}>
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
