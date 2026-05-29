import type { FieldType } from "@/lib/types";
import type { FieldProps } from "./field-components";
import {
  TextField,
  NumberField,
  EmailField,
  PasswordField,
  TextareaField,
  SelectField,
  CheckboxField,
  DateField,
  FallbackField,
} from "./field-components";

// ─── The Registry ─────────────────────────────────────────────────────────────
// Maps every supported field type to its React component.
// To add a new field type:
//   1. Create a component in field-components.tsx
//   2. Import it here
//   3. Add it to this map
const fieldRegistry: Record<FieldType, React.ComponentType<FieldProps>> = {
  text: TextField,
  number: NumberField,
  email: EmailField,
  password: PasswordField,
  textarea: TextareaField,
  select: SelectField,
  checkbox: CheckboxField,
  date: DateField,
};

/**
 * Look up a component for a given field type.
 * Returns FallbackField if the type is not registered (graceful degradation).
 */
export function getFieldComponent(type: string): React.ComponentType<FieldProps> {
  const Component = fieldRegistry[type as FieldType];
  return Component ?? FallbackField;
}
