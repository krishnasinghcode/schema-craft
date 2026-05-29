import { z } from "zod";
import type { SchemaField } from "@/lib/types";

export function buildRecordValidator(fields: SchemaField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
      case "password": {
        let v = z.string();
        if (field.minLength) v = v.min(field.minLength, `Must be at least ${field.minLength} characters`);
        if (field.maxLength) v = v.max(field.maxLength, `Must be at most ${field.maxLength} characters`);
        validator = v;
        break;
      }
      case "email": {
        validator = z.string().email("Must be a valid email address");
        break;
      }
      case "number": {
        let v = z.number({ error: "Must be a number" });
        if (field.min !== undefined) v = v.min(field.min, `Must be at least ${field.min}`);
        if (field.max !== undefined) v = v.max(field.max, `Must be at most ${field.max}`);
        validator = v;
        break;
      }
      case "select": {
        const options = field.options ?? [];
        if (options.length === 0) {
          validator = z.string();
        } else {
          validator = z.enum(options as [string, ...string[]], {
            error: `Must be one of: ${options.join(", ")}`,
          });
        }
        break;
      }
      case "checkbox": {
        validator = z.boolean();
        break;
      }
      case "date": {
        validator = z.string().check((ctx) => {
          const date = new Date(ctx.value);
          if (isNaN(date.getTime())) {
            ctx.issues.push({ code: "custom", message: "Must be a valid date", path: [], input: ctx.value });
          }
        });
        break;
      }
      default: {
        validator = z.unknown();
        break;
      }
    }

    if (field.required) {
      shape[field.name] = validator;
    } else {
      if (["text", "textarea", "password", "email"].includes(field.type)) {
        shape[field.name] = z.union([z.literal(""), validator as z.ZodString]).optional();
      } else if (field.type === "number") {
        shape[field.name] = (validator as z.ZodNumber).optional().nullable();
      } else {
        shape[field.name] = validator.optional();
      }
    }
  }

  return z.object(shape);
}

export function formatRecordErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "general";
    result[key] = issue.message;
  }
  return result;
}
