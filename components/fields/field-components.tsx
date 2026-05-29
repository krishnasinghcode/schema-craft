"use client";

import type { SchemaField } from "@/lib/types";

// ─── Props shared by every field component ────────────────────────────────────
export interface FieldProps {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

// ─── Base input styles ─────────────────────────────────────────────────────────
const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed";

const errorClass = "border-red-500 focus:ring-red-500";

// ─── TextField ────────────────────────────────────────────────────────────────
export function TextField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <input
      type="text"
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
      disabled={disabled}
      className={`${inputClass} ${error ? errorClass : ""}`}
    />
  );
}

// ─── NumberField ──────────────────────────────────────────────────────────────
export function NumberField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <input
      type="number"
      id={field.name}
      value={(value as number) ?? ""}
      onChange={(e) => {
        const num = e.target.value === "" ? undefined : Number(e.target.value);
        onChange(num);
      }}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
      min={field.min}
      max={field.max}
      disabled={disabled}
      className={`${inputClass} ${error ? errorClass : ""}`}
    />
  );
}

// ─── EmailField ───────────────────────────────────────────────────────────────
export function EmailField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <input
      type="email"
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? "name@example.com"}
      disabled={disabled}
      className={`${inputClass} ${error ? errorClass : ""}`}
    />
  );
}

// ─── PasswordField ────────────────────────────────────────────────────────────
export function PasswordField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <input
      type="password"
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? "••••••••"}
      disabled={disabled}
      className={`${inputClass} ${error ? errorClass : ""}`}
    />
  );
}

// ─── TextareaField ────────────────────────────────────────────────────────────
export function TextareaField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <textarea
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
      disabled={disabled}
      rows={3}
      className={`${inputClass} resize-y ${error ? errorClass : ""}`}
    />
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────
export function SelectField({ field, value, onChange, error, disabled }: FieldProps) {
  const options = field.options ?? [];
  return (
    <select
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${inputClass} cursor-pointer ${error ? errorClass : ""}`}
    >
      <option value="">Select an option...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// ─── CheckboxField ────────────────────────────────────────────────────────────
export function CheckboxField({ field, value, onChange, disabled }: FieldProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        id={field.name}
        checked={(value as boolean) ?? field.defaultChecked ?? false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
      />
      <label htmlFor={field.name} className="text-sm text-zinc-300 cursor-pointer">
        {field.label}
      </label>
    </div>
  );
}

// ─── DateField ────────────────────────────────────────────────────────────────
export function DateField({ field, value, onChange, error, disabled }: FieldProps) {
  return (
    <input
      type="date"
      id={field.name}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`${inputClass} ${error ? errorClass : ""}`}
    />
  );
}

// ─── FallbackField ────────────────────────────────────────────────────────────
// Shown when the field type is unknown — graceful degradation, no crash
export function FallbackField({ field }: FieldProps) {
  return (
    <div className="rounded-lg border border-yellow-600/40 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-400">
      ⚠ Unsupported field type: <code className="font-mono">{field.type}</code>
    </div>
  );
}
