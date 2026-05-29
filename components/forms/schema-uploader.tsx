"use client";

import { useState } from "react";
import { safeJsonParse } from "@/lib/utils";
import { Loader2, Upload, CheckCircle } from "lucide-react";

const EXAMPLE_SCHEMA = JSON.stringify(
  {
    entity: "students",
    title: "Student Management",
    fields: [
      { name: "fullName", label: "Full Name", type: "text", required: true, minLength: 3, maxLength: 50 },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "age", label: "Age", type: "number", required: true, min: 16, max: 100 },
      { name: "course", label: "Course", type: "select", required: true, options: ["Computer Science", "Engineering", "Business", "Arts"] },
      { name: "enrolled", label: "Is Enrolled", type: "checkbox" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  null,
  2
);

interface SchemaUploaderProps {
  onSuccess: () => void;
}

export function SchemaUploader({ onSuccess }: SchemaUploaderProps) {
  const [jsonText, setJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleLoadExample() {
    setJsonText(EXAMPLE_SCHEMA);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Try to parse the JSON first on the client
    const parsed = safeJsonParse(jsonText.trim());
    if (!parsed) {
      setError("Invalid JSON. Please check your syntax.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/schemas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to save schema");
        return;
      }

      setSuccess(true);
      setJsonText("");
      setTimeout(onSuccess, 1000); // let user see the success state
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">Upload JSON Schema</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Define your entity structure and fields
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadExample}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition"
        >
          Load example →
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError(null);
          }}
          placeholder={`Paste your schema JSON here...\n\nExample:\n{\n  "entity": "products",\n  "title": "Product Catalog",\n  "fields": [...]\n}`}
          rows={14}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y"
        />

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500/30 bg-green-900/20 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Schema saved successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !jsonText.trim()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isLoading ? "Saving..." : "Save Schema"}
        </button>
      </form>

      {/* Field type reference */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <p className="text-xs font-medium text-zinc-400 mb-2">Supported field types:</p>
        <div className="flex flex-wrap gap-1.5">
          {["text", "number", "email", "password", "textarea", "select", "checkbox", "date"].map((t) => (
            <code key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 font-mono">
              {t}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
