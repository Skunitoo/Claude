"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Mail, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types/database";

export default function NotificationsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(50);
      setNotifications((data as Notification[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const typeIcon = (type: string) => {
    switch (type) {
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Powiadomienia</h1>
          {unreadCount > 0 && (
            <Badge>{unreadCount} nowych</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="mr-1 h-3 w-3" />
            Oznacz wszystkie jako przeczytane
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Ladowanie...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Brak powiadomien</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={!n.read_at ? "border-primary/50 bg-primary/5" : ""}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="mt-0.5 text-muted-foreground">
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1">
                  {n.subject && <p className="text-sm font-medium">{n.subject}</p>}
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(n.sent_at)}
                  </p>
                </div>
                {!n.read_at && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
