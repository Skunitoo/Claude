"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { INDUSTRIES, SUBSCRIPTION_TIERS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Organization } from "@/types/database";

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user?.organization_id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", user.organization_id)
        .single();
      if (data) {
        setOrg(data as Organization);
        setOrgName(data.name);
        setOrgIndustry(data.industry || "");
      }
    }
    load();
  }, [user?.organization_id]);

  const saveSettings = async () => {
    if (!user?.organization_id) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name: orgName, industry: orgIndustry || null })
      .eq("id", user.organization_id);

    if (error) {
      toast({ title: "Blad", description: "Nie udalo sie zapisac ustawien", variant: "destructive" });
    } else {
      toast({ title: "Zapisano", description: "Ustawienia organizacji zostaly zaktualizowane" });
    }
    setSaving(false);
  };

  const tier = org ? SUBSCRIPTION_TIERS[org.subscription_tier as keyof typeof SUBSCRIPTION_TIERS] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organizacja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nazwa firmy</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Branza</Label>
            <Select
              options={Object.entries(INDUSTRIES).map(([k, v]) => ({ value: k, label: v }))}
              value={orgIndustry}
              onChange={(e) => setOrgIndustry(e.target.value)}
              placeholder="Wybierz branze"
            />
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan subskrypcji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tier ? (
            <>
              <div className="flex items-center gap-3">
                <Badge>{tier.name}</Badge>
                <span className="text-2xl font-bold">
                  {tier.price > 0 ? `${formatCurrency(tier.price)}/mies.` : "Darmowy"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Max pracownikow: {tier.maxEmployees === Infinity ? "bez limitu" : tier.maxEmployees}
              </p>
              <div className="flex flex-wrap gap-1">
                {tier.features.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Ladowanie informacji o planie...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil uzytkownika</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Imie:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rola:</strong> {user?.role === "manager" ? "Kierownik" : user?.role === "admin" ? "Admin" : "Pracownik"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
