import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx + tailwind-merge.
 * Handles conditional classes and deduplicates tailwind classes.
 *
 * Usage: cn("px-4", isActive && "bg-blue-500", "px-2")
 * → "bg-blue-500 px-2"  (px-4 gets replaced by px-2)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Try to parse JSON safely. Returns null if invalid.
 */
export function safeJsonParse<T = unknown>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Convert a camelCase or snake_case string to Title Case
 * e.g. "fullName" → "Full Name", "full_name" → "Full Name"
 */
export function toTitleCase(str: string): string {
  // Handle camelCase
  const withSpaces = str.replace(/([A-Z])/g, " $1");
  // Handle snake_case
  const withoutUnderscores = withSpaces.replace(/_/g, " ");
  // Capitalize first letter of each word
  return withoutUnderscores
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}
