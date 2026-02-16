import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">ShiftFlow</h1>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Zaloguj się</Button>
          </Link>
          <Link href="/signup">
            <Button>Rozpocznij za darmo</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 text-center">
        <h2 className="mb-6 text-5xl font-bold tracking-tight">
          Grafik pracy
          <br />
          <span className="text-primary/70">bez chaosu</span>
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Twórz grafiki w minuty, nie godziny. Pracownicy widzą swoje zmiany na
          telefonie. Zamiany zmian, urlopy i powiadomienia SMS — wszystko w
          jednym miejscu.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Wypróbuj za darmo</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Zaloguj się
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 text-left">
            <div className="mb-3 text-3xl">📅</div>
            <h3 className="mb-2 font-semibold">Szybkie tworzenie grafiku</h3>
            <p className="text-sm text-muted-foreground">
              Przeciągnij i upuść pracowników na kalendarz. System ostrzeże przed
              konfliktami i naruszeniami prawa pracy.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-left">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 font-semibold">Dostępność online</h3>
            <p className="text-sm text-muted-foreground">
              Pracownicy zaznaczają dostępność na telefonie. Otrzymujesz
              przypomnienia SMS przed terminem.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-left">
            <div className="mb-3 text-3xl">🔄</div>
            <h3 className="mb-2 font-semibold">Zamiany zmian</h3>
            <p className="text-sm text-muted-foreground">
              Pracownicy sami zamieniają się zmianami. Ty tylko zatwierdzasz
              jednym kliknięciem.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <h3 className="mb-6 text-2xl font-semibold">Cennik</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Darmowy</h4>
              <p className="my-2 text-3xl font-bold">0 zł</p>
              <p className="text-sm text-muted-foreground">do 5 pracowników</p>
            </div>
            <div className="rounded-lg border-2 border-primary bg-card p-6">
              <h4 className="font-semibold">Starter</h4>
              <p className="my-2 text-3xl font-bold">49 zł<span className="text-sm font-normal">/mies.</span></p>
              <p className="text-sm text-muted-foreground">do 15 pracowników</p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h4 className="font-semibold">Pro</h4>
              <p className="my-2 text-3xl font-bold">149 zł<span className="text-sm font-normal">/mies.</span></p>
              <p className="text-sm text-muted-foreground">do 30 pracowników</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto border-t p-6 text-center text-sm text-muted-foreground">
        © 2026 ShiftFlow. Wszelkie prawa zastrzeżone.
      </footer>
    </div>
  );
}
