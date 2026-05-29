"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import type { EntitySchema } from "@/lib/types";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

interface CsvImporterProps {
  schema: EntitySchema;
  entityName: string;
  onSuccess: () => void;
}

interface ImportResult {
  imported: number;
  failed: number;
  failures: { row: number; error: string }[];
}

export function CsvImporter({ schema, entityName, onSuccess }: CsvImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Convert parsed strings to proper types based on schema
        const converted = (results.data as Record<string, string>[]).map((row) => {
          const converted: Record<string, unknown> = {};
          for (const field of schema.fields) {
            const rawValue = row[field.name] ?? row[field.label] ?? "";
            if (field.type === "number") {
              converted[field.name] = rawValue === "" ? undefined : Number(rawValue);
            } else if (field.type === "checkbox") {
              converted[field.name] = rawValue.toLowerCase() === "true" || rawValue === "1";
            } else {
              converted[field.name] = rawValue;
            }
          }
          return converted;
        });
        setRows(converted);
      },
      error: () => {
        setError("Could not parse CSV file. Make sure it's a valid CSV.");
      },
    });
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/runtime/${entityName}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Import failed");
        return;
      }

      setResult(data.data);
      if (data.data.imported > 0) {
        setTimeout(onSuccess, 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-3">
          CSV columns should match field names:{" "}
          {schema.fields.map((f) => (
            <code key={f.name} className="mx-0.5 rounded bg-zinc-800 px-1 py-0.5 text-xs font-mono text-zinc-400">
              {f.name}
            </code>
          ))}
        </p>

        {/* File drop area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900/30 px-6 py-8 text-center transition"
        >
          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-zinc-300">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span className="text-sm">{fileName}</span>
              {rows.length > 0 && (
                <span className="text-xs text-zinc-500">({rows.length} rows)</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400">Click to upload a CSV file</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            {result.imported} records imported
          </div>
          {result.failed > 0 && (
            <div className="text-sm text-yellow-400">
              {result.failed} rows failed:
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-400">
                {result.failures.slice(0, 5).map((f) => (
                  <li key={f.row}>Row {f.row}: {f.error}</li>
                ))}
                {result.failures.length > 5 && (
                  <li>...and {result.failures.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={isLoading || rows.length === 0}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Importing..." : `Import ${rows.length} Rows`}
      </button>
    </div>
  );
}
