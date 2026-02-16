export const APP_NAME = "ShiftFlow";

export const SHIFT_TYPES = {
  morning: { label: "Poranna", start: "08:00", end: "16:00", color: "bg-amber-100 text-amber-800" },
  evening: { label: "Popoludniowa", start: "16:00", end: "22:00", color: "bg-blue-100 text-blue-800" },
  night: { label: "Nocna", start: "22:00", end: "06:00", color: "bg-indigo-100 text-indigo-800" },
} as const;

export const AVAILABILITY_STATUS = {
  available: { label: "Dostepny/a", color: "bg-green-500", textColor: "text-green-700" },
  prefer_not: { label: "Wolalbym/wolalabym nie", color: "bg-yellow-500", textColor: "text-yellow-700" },
  unavailable: { label: "Niedostepny/a", color: "bg-red-500", textColor: "text-red-700" },
} as const;

export const USER_ROLES = {
  admin: "Administrator",
  manager: "Kierownik",
  employee: "Pracownik",
} as const;

export const INDUSTRIES = {
  restaurant: "Restauracja",
  retail: "Handel detaliczny",
  salon: "Salon urody",
  other: "Inne",
} as const;

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Darmowy",
    price: 0,
    maxEmployees: 5,
    features: ["manual_scheduling", "email_notifications"],
  },
  starter: {
    name: "Starter",
    price: 49,
    maxEmployees: 15,
    features: ["manual_scheduling", "sms_notifications", "swaps", "basic_analytics"],
  },
  pro: {
    name: "Pro",
    price: 149,
    maxEmployees: 30,
    features: ["ai_scheduling", "time_off", "advanced_analytics", "export"],
  },
  enterprise: {
    name: "Enterprise",
    price: 299,
    maxEmployees: Infinity,
    features: ["multi_location", "api_access", "custom_integrations"],
  },
} as const;

export const TIME_OFF_TYPES = {
  vacation: "Urlop wypoczynkowy",
  sick_leave: "Zwolnienie lekarskie (L4)",
  personal: "Urlop okolicznosciowy",
  unpaid: "Urlop bezplatny",
} as const;

export const SWAP_STATUS = {
  pending: "Oczekujacy",
  accepted: "Zaakceptowany",
  rejected: "Odrzucony",
  cancelled: "Anulowany",
} as const;

export const SCHEDULE_STATUS = {
  draft: "Szkic",
  published: "Opublikowany",
  archived: "Zarchiwizowany",
} as const;

export const DAYS_PL = [
  "Poniedzialek",
  "Wtorek",
  "Sroda",
  "Czwartek",
  "Piatek",
  "Sobota",
  "Niedziela",
] as const;

export const DAYS_SHORT_PL = ["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Ndz"] as const;

export const SKILLS = [
  "barista",
  "kelner",
  "kucharz",
  "kasjer",
  "sprzatanie",
  "obsluga_klienta",
  "magazyn",
  "kierownik_zmiany",
] as const;
