"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface BulkImportDialogProps {
  organizationId: string;
  onSuccess: () => void;
}

interface ParsedEmployee {
  fullName: string;
  email: string;
  phone?: string;
  hourlyRate?: number;
}

export function BulkImportDialog({ organizationId, onSuccess }: BulkImportDialogProps) {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedEmployee[]>([]);
  const { toast } = useToast();

  const parseCSV = (text: string): ParsedEmployee[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const nameIdx = header.findIndex((h) => h.includes("name") || h.includes("imie") || h.includes("nazwisko"));
    const emailIdx = header.findIndex((h) => h.includes("email") || h.includes("mail"));
    const phoneIdx = header.findIndex((h) => h.includes("phone") || h.includes("telefon"));
    const rateIdx = header.findIndex((h) => h.includes("rate") || h.includes("stawka"));

    if (nameIdx === -1 || emailIdx === -1) return [];

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        fullName: cols[nameIdx] || "",
        email: cols[emailIdx] || "",
        phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
        hourlyRate: rateIdx >= 0 ? parseFloat(cols[rateIdx]) || undefined : undefined,
      };
    }).filter((e) => e.fullName && e.email);
  };

  const handlePreview = () => {
    const parsed = parseCSV(csv);
    if (parsed.length === 0) {
      toast({ title: "Blad", description: "Nie znaleziono prawidlowych danych. Upewnij sie ze CSV zawiera kolumny: imie/name, email", variant: "destructive" });
      return;
    }
    setPreview(parsed);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    const supabase = createClient();
    let imported = 0;
    let failed = 0;

    for (const emp of preview) {
      const tempPassword = Math.random().toString(36).slice(2) + "Aa1!";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emp.email,
        password: tempPassword,
        options: { data: { full_name: emp.fullName, role: "employee" } },
      });

      if (authError || !authData.user) {
        failed++;
        continue;
      }

      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: emp.email,
        full_name: emp.fullName,
        phone: emp.phone || null,
        role: "employee",
        organization_id: organizationId,
      });

      if (profileError) {
        failed++;
        continue;
      }

      await supabase.from("employees").insert({
        id: authData.user.id,
        hourly_rate: emp.hourlyRate || null,
        skills: [],
        max_hours_per_week: 40,
        preferred_shift_types: [],
      });

      imported++;
    }

    toast({
      title: "Import zakonczony",
      description: `Zaimportowano ${imported} pracownikow${failed > 0 ? `, ${failed} bledow` : ""}`,
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wklej dane CSV</Label>
        <Textarea
          rows={8}
          placeholder={"imie,email,telefon,stawka\nJan Kowalski,jan@firma.pl,+48123456789,25"}
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview([]);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Wymagane kolumny: imie/name, email. Opcjonalne: telefon/phone, stawka/rate
        </p>
      </div>

      {preview.length === 0 ? (
        <Button onClick={handlePreview} disabled={!csv.trim()} className="w-full">
          Podglad ({csv.trim().split("\n").length - 1} wierszy)
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="max-h-48 overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="p-2 text-left">Imie</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Telefon</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((emp, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{emp.fullName}</td>
                    <td className="p-2">{emp.email}</td>
                    <td className="p-2">{emp.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview([])} className="flex-1">
              Cofnij
            </Button>
            <Button onClick={handleImport} disabled={loading} className="flex-1">
              {loading ? "Importowanie..." : `Importuj ${preview.length} pracownikow`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
