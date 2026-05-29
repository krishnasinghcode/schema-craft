"use client";

import { useState } from "react";
import type { SchemaField, EntitySchema } from "@/lib/types";
import { getFieldComponent } from "@/components/fields/field-registry";
import { Loader2 } from "lucide-react";

interface DynamicFormProps {
  schema: EntitySchema;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function DynamicForm({
  schema,
  onSubmit,
  initialValues = {},
  submitLabel = "Submit",
  isLoading = false,
}: DynamicFormProps) {
  // Single state object holds all field values, keyed by field name
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with defaults from schema or initial values
    const defaults: Record<string, unknown> = {};
    for (const field of schema.fields) {
      if (initialValues[field.name] !== undefined) {
        defaults[field.name] = initialValues[field.name];
      } else if (field.type === "checkbox") {
        defaults[field.name] = field.defaultChecked ?? false;
      } else {
        defaults[field.name] = "";
      }
    }
    return defaults;
  });

  // Field-level validation errors shown below each input
  const [errors, setErrors] = useState<Record<string, string>>({});
  // General submit error shown at the top of the form
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleFieldChange(fieldName: string, value: unknown) {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear the error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  function validateOnClient(fields: SchemaField[]): boolean {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = values[field.name];

      if (field.required) {
        if (field.type === "checkbox") {
          // Checkboxes don't have a "required" concept really, skip
          continue;
        }
        if (value === "" || value === undefined || value === null) {
          newErrors[field.name] = `${field.label} is required`;
          continue;
        }
      }

      // Extra validation for non-empty values
      if (value !== "" && value !== undefined && value !== null) {
        if (field.type === "text" || field.type === "textarea") {
          const str = value as string;
          if (field.minLength && str.length < field.minLength) {
            newErrors[field.name] = `Must be at least ${field.minLength} characters`;
          }
          if (field.maxLength && str.length > field.maxLength) {
            newErrors[field.name] = `Must be at most ${field.maxLength} characters`;
          }
        }

        if (field.type === "number") {
          const num = value as number;
          if (field.min !== undefined && num < field.min) {
            newErrors[field.name] = `Must be at least ${field.min}`;
          }
          if (field.max !== undefined && num > field.max) {
            newErrors[field.name] = `Must be at most ${field.max}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validation first (for UX, backend also validates)
    const isValid = validateOnClient(schema.fields);
    if (!isValid) return;

    try {
      await onSubmit(values);
    } catch (err) {
      // If the onSubmit throws with field errors, display them
      if (err instanceof FieldValidationError) {
        setErrors(err.fieldErrors);
        setSubmitError("Please fix the errors below.");
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {submitError && (
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {schema.fields.map((field) => {
        const FieldComponent = getFieldComponent(field.type);
        const isCheckbox = field.type === "checkbox";

        return (
          <div key={field.name} className="space-y-1.5">
            {/* Don't show label for checkboxes — the component renders its own */}
            {!isCheckbox && (
              <label htmlFor={field.name} className="block text-sm font-medium text-zinc-300">
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </label>
            )}

            <FieldComponent
              field={field}
              value={values[field.name]}
              onChange={(val) => handleFieldChange(field.name, val)}
              error={errors[field.name]}
              disabled={isLoading}
            />

            {/* Field-level error message */}
            {errors[field.name] && !isCheckbox && (
              <p className="text-xs text-red-400">{errors[field.name]}</p>
            )}

            {/* Optional helper hint for number/text constraints */}
            {!errors[field.name] && (field.minLength || field.maxLength || field.min !== undefined || field.max !== undefined) && (
              <p className="text-xs text-zinc-500">
                {field.type === "text" || field.type === "textarea" ? (
                  <>
                    {field.minLength && `Min ${field.minLength} chars`}
                    {field.minLength && field.maxLength && " · "}
                    {field.maxLength && `Max ${field.maxLength} chars`}
                  </>
                ) : (
                  <>
                    {field.min !== undefined && `Min: ${field.min}`}
                    {field.min !== undefined && field.max !== undefined && " · "}
                    {field.max !== undefined && `Max: ${field.max}`}
                  </>
                )}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}

// Custom error class for propagating field-level errors from the server
export class FieldValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("Validation failed");
    this.fieldErrors = fieldErrors;
  }
}
