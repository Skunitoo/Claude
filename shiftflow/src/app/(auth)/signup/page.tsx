"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { INDUSTRIES } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "manager" },
  });

  const role = watch("role");

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Wystąpił błąd podczas rejestracji");
      setLoading(false);
      return;
    }

    // 2. If manager, create organization
    let organizationId: string | null = null;
    if (data.role === "manager" && data.organizationName) {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: data.organizationName,
          industry: data.industry || null,
        })
        .select()
        .single();

      if (orgError) {
        setError("Nie udało się utworzyć organizacji");
        setLoading(false);
        return;
      }
      organizationId = org.id;
    }

    // 3. Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      organization_id: organizationId,
    });

    if (profileError) {
      setError("Nie udało się utworzyć profilu użytkownika");
      setLoading(false);
      return;
    }

    // 4. If employee, create employee record
    if (data.role === "employee") {
      await supabase.from("employees").insert({
        id: authData.user.id,
      });
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Utwórz konto</CardTitle>
          <CardDescription>Rozpocznij zarządzanie grafikiem</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Imię i nazwisko</Label>
              <Input
                id="fullName"
                placeholder="Jan Kowalski"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@przykład.pl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 znaków"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Powtórz hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Powtórz hasło"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rola</Label>
              <Select
                options={[
                  { value: "manager", label: "Kierownik / Właściciel" },
                  { value: "employee", label: "Pracownik" },
                ]}
                {...register("role")}
              />
            </div>

            {role === "manager" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nazwa firmy</Label>
                  <Input
                    id="organizationName"
                    placeholder="np. Restauracja Pod Lipami"
                    {...register("organizationName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branża</Label>
                  <Select
                    options={Object.entries(INDUSTRIES).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    placeholder="Wybierz branżę"
                    {...register("industry")}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Tworzenie konta..." : "Utwórz konto"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Masz już konto?{" "}
              <Link href="/login" className="text-primary underline">
                Zaloguj się
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
