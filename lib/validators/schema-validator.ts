import { z } from "zod";

const ALLOWED_FIELD_TYPES = [
  "text",
  "number",
  "email",
  "password",
  "textarea",
  "select",
  "checkbox",
  "date",
] as const;

const fieldSchema = z.object({
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Field name must start with a letter and contain only letters, numbers, underscores"),
  label: z.string().min(1, "Field label is required"),
  type: z.enum(ALLOWED_FIELD_TYPES, {
    error: `Field type must be one of: ${ALLOWED_FIELD_TYPES.join(", ")}`,
  }),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.string().min(1)).optional(),
  defaultChecked: z.boolean().optional(),
});

export const entitySchemaValidator = z.object({
  entity: z
    .string()
    .min(1, "Entity name is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Entity name must be lowercase letters, numbers, underscores"),
  title: z.string().min(1, "Title is required"),
  fields: z
    .array(fieldSchema)
    .min(1, "At least one field is required")
    .max(20, "Maximum 20 fields allowed")
    .check((ctx) => {
      const fields = ctx.value;
      const names = fields.map((f) => f.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        ctx.issues.push({
          code: "custom",
          message: "All field names must be unique",
          path: [],
          input: fields,
        });
      }
      const selectFields = fields.filter((f) => f.type === "select");
      for (const sf of selectFields) {
        if (!sf.options || sf.options.length === 0) {
          ctx.issues.push({
            code: "custom",
            message: `Select field "${sf.name}" must have at least one option`,
            path: [],
            input: fields,
          });
        }
      }
    }),
});

export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) return "Validation failed";
  const path = firstIssue.path.join(".");
  if (path) return `${path}: ${firstIssue.message}`;
  return firstIssue.message;
}

export type ValidatedEntitySchema = z.infer<typeof entitySchemaValidator>;
