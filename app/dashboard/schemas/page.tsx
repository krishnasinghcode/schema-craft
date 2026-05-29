"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SchemaUploader } from "@/components/forms/schema-uploader";
import { Database, Trash2, ArrowRight, Plus, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SchemaWithCount {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  _count: { records: number };
}

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<SchemaWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadSchemas() {
    try {
      const res = await fetch("/api/schemas");
      const data = await res.json();
      if (data.success) setSchemas(data.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSchemas();
  }, []);

  async function handleDelete(schema: SchemaWithCount) {
    const confirmMsg = schema._count.records > 0
      ? `Delete "${schema.title}" and all ${schema._count.records} records? This cannot be undone.`
      : `Delete "${schema.title}"? This cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    setDeletingId(schema.id);
    try {
      const res = await fetch(`/api/schemas/${schema.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSchemas((prev) => prev.filter((s) => s.id !== schema.id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Schemas</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Upload a JSON schema to generate a CRUD interface instantly.
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
        >
          {showUploader ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showUploader ? "Cancel" : "New Schema"}
        </button>
      </div>

      {/* Schema uploader panel */}
      {showUploader && (
        <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <SchemaUploader
            onSuccess={() => {
              setShowUploader(false);
              loadSchemas();
            }}
          />
        </div>
      )}

      {/* Schema list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : schemas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
          <Database className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 mb-1 font-medium">No schemas yet</p>
          <p className="text-sm text-zinc-600">
            Click &ldquo;New Schema&rdquo; above to upload your first JSON schema.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemas.map((schema) => (
            <div
              key={schema.id}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(schema)}
                disabled={deletingId === schema.id}
                className="absolute right-3 top-3 p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                title="Delete schema"
              >
                {deletingId === schema.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>

              <div className="mb-4">
                <div className="mb-2 inline-flex rounded-lg bg-indigo-900/30 p-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white">{schema.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  <code className="font-mono">{schema.name}</code>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  <span className="text-zinc-300 font-medium">{schema._count.records}</span> records
                  <span className="mx-1.5">·</span>
                  {formatDate(schema.createdAt)}
                </div>
                <Link
                  href={`/dashboard/entity/${schema.name}`}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
