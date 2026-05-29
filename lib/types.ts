// ─── Field Types ─────────────────────────────────────────────────────────────
// These are all the field types our system supports.
// When you add a new type here, also add it to:
//   1. lib/validators/schema-validator.ts (the allowed types list)
//   2. components/fields/ (a new field component)
//   3. components/fields/field-registry.ts (register the component)

export type FieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "textarea"
  | "select"
  | "checkbox"
  | "date";

// ─── Schema Field ─────────────────────────────────────────────────────────────
// One field in the schema. Maps to one form input.
export interface SchemaField {
  name: string;       // programmatic key, e.g. "fullName"
  label: string;      // display label, e.g. "Full Name"
  type: FieldType;
  required?: boolean;
  placeholder?: string;

  // text / textarea
  minLength?: number;
  maxLength?: number;

  // number
  min?: number;
  max?: number;

  // select
  options?: string[]; // e.g. ["male", "female", "other"]

  // checkbox
  defaultChecked?: boolean;
}

// ─── Entity Schema ────────────────────────────────────────────────────────────
// This is what the user uploads. The whole configuration for one entity.
export interface EntitySchema {
  entity: string;   // unique identifier, e.g. "students" (no spaces)
  title: string;    // display name, e.g. "Student Management"
  fields: SchemaField[];
}

// ─── API Response Shapes ──────────────────────────────────────────────────────
// Standard shape for all API responses so frontend can handle them uniformly.

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, string[]>; // field-level errors from Zod
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── DB Row Shapes ────────────────────────────────────────────────────────────
// What comes back from the database (after JSON.parse if needed)

export interface StoredSchema {
  id: string;
  name: string;
  title: string;
  schemaJson: EntitySchema;
  userId: string;
  createdAt: string;
}

export interface StoredRecord {
  id: string;
  entityName: string;
  dataJson: Record<string, unknown>;
  userId: string;
  entityId: string;
  createdAt: string;
}
