import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  value?: string;
  children: ReactNode;
}

export function Field({ label, value, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
        {label}
        {value && <span className="text-foreground">{value}</span>}
      </span>
      {children}
    </label>
  );
}
