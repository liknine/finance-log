export type MainCurrency = "BYN" | "RUB";

export const MAIN_CURRENCIES: MainCurrency[] = ["BYN", "RUB"];
export const DEFAULT_CURRENCY: MainCurrency = "BYN";
export const RUB_RATE_STORAGE_KEY = "finance-log-rub-rate";
export const DEFAULT_RUB_RATE = 30;

export function getRubRate(): number {
  if (typeof window === "undefined") return DEFAULT_RUB_RATE;
  const saved = Number(window.localStorage.getItem(RUB_RATE_STORAGE_KEY));
  return Number.isFinite(saved) && saved >= 5 ? saved : DEFAULT_RUB_RATE;
}

export function setSavedRubRate(value: number): number {
  const safe = Number.isFinite(value) && value > 0 ? value : DEFAULT_RUB_RATE;
  if (typeof window !== "undefined") window.localStorage.setItem(RUB_RATE_STORAGE_KEY, String(safe));
  return safe;
}

export function displayAmount(value: number | string, currency: MainCurrency = DEFAULT_CURRENCY): number {
  const numeric = Number(value) || 0;
  return currency === "RUB" ? numeric * getRubRate() : numeric;
}

export function money(value: number | string, currency: MainCurrency = DEFAULT_CURRENCY): string {
  const n = Math.round(displayAmount(value, currency));
  return `${new Intl.NumberFormat("ru-RU").format(n)} ${currency}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function theme(dark: boolean, lightClass: string, darkClass: string): string {
  return dark ? darkClass : lightClass;
}

export function toNumber(value: number | string): number {
  return Number(value) || 0;
}

export function todayInputValue(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function inputDateToIso(value: string, fallback?: string): string {
  if (!value) return fallback || new Date().toISOString();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return fallback || new Date().toISOString();
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

export function dateToInputValue(value?: string): string {
  if (!value) return todayInputValue();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return todayInputValue();
}

export function formatClientDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatDisplayDate(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return value || "Сегодня";

  const current = new Date();
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  const diff = Math.round((today - target) / 86400000);

  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Вчера";

  const options: Intl.DateTimeFormatOptions = parsed.getFullYear() === current.getFullYear()
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short", year: "numeric" };

  return new Intl.DateTimeFormat("ru-RU", options).format(parsed).replace(" г.", "");
}
