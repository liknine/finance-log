import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn, theme } from "../utils/finance";

export function CardBox({ children, dark, className = "" }: { children: ReactNode; dark: boolean; className?: string }) {
  return <section className={cn("card", dark && "cardDark", className)}>{children}</section>;
}

export function Field({ label, children, dark }: { label: string; children: ReactNode; dark: boolean }) {
  return (
    <label className={cn("field", theme(dark, "muted", "mutedDark"))}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input({ dark, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { dark: boolean }) {
  return <input {...props} className={cn("input", dark && "inputDark", className)} />;
}

export function Select({ dark, className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { dark: boolean }) {
  return <select {...props} className={cn("input", dark && "inputDark", className)}>{children}</select>;
}

export function MiniStat({ label, value, good, bad, dark }: { label: string; value: ReactNode; good?: boolean; bad?: boolean; dark: boolean }) {
  return (
    <div className={cn("mini", dark && "miniDark")}> 
      <div className={cn("miniLabel", theme(dark, "muted", "mutedDark"))}>{label}</div>
      <div className={cn("miniValue", good && "green", bad && "red", theme(dark, "text", "textDark"))}>{value}</div>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const className = value === "Закрыта" ? "statusGreen" : value === "В пути" ? "statusBlue" : value === "Ожидает оплату" ? "statusAmber" : "statusGray";
  return <span className={cn("status", className)}>{value}</span>;
}

export function SectionTitle({ n, children, dark }: { n: string; children: ReactNode; dark: boolean }) {
  return <div className={cn("sectionTitle", theme(dark, "text", "textDark"))}>{n}. {children}</div>;
}
