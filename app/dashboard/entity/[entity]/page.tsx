"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DynamicForm, FieldValidationError } from "@/components/forms/dynamic-form";
import { DynamicTable } from "@/components/forms/dynamic-table";
import { CsvImporter } from "@/components/forms/csv-importer";
import type { EntitySchema, StoredRecord } from "@/lib/types";
import {
  Loader2,
  Plus,
  X,
  Pencil,
  Upload,
  ArrowLeft,
  Database,
} from "lucide-react";
import Link from "next/link";

type Tab = "records" | "add" | "import";

export default function EntityPage() {
  const params = useParams();
  const router = useRouter();
  const entityName = params.entity as string;

  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("records");

  // For edit mode — which record is being edited
  const [editingRecord, setEditingRecord] = useState<StoredRecord | null>(null);

  // ─── Load schema ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSchema() {
      try {
        // Get all schemas and find the one matching this entity name
        const res = await fetch("/api/schemas");
        const data = await res.json();

        if (!data.success) {
          router.replace("/dashboard/schemas");
          return;
        }

        const found = data.data.find(
          (s: { name: string; schemaJson: EntitySchema }) => s.name === entityName
        );

        if (!found) {
          router.replace("/dashboard/schemas");
          return;
        }

        setSchema(found.schemaJson as EntitySchema);
      } catch {
        router.replace("/dashboard/schemas");
      } finally {
        setIsLoadingSchema(false);
      }
    }
    loadSchema();
  }, [entityName, router]);

  // ─── Load records ────────────────────────────────────────────────────────────
  const loadRecords = useCallback(async (page = 1) => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch(`/api/runtime/${entityName}?page=${page}&limit=20`);
      const data = await res.json();

      if (data.success) {
        setRecords(data.data.records);
        setPagination(data.data.pagination);
      }
    } finally {
      setIsLoadingRecords(false);
    }
  }, [entityName]);

  useEffect(() => {
    if (!isLoadingSchema) {
      loadRecords();
    }
  }, [isLoadingSchema, loadRecords]);

  // ─── Create record ───────────────────────────────────────────────────────────
  async function handleCreate(formData: Record<string, unknown>) {
    const res = await fetch(`/api/runtime/${entityName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!data.success) {
      // If backend returns field-level errors, propagate them to the form
      if (data.details) {
        throw new FieldValidationError(data.details);
      }
      throw new Error(data.error ?? "Failed to create record");
    }

    await loadRecords();
    setActiveTab("records");
  }

  // ─── Update record ───────────────────────────────────────────────────────────
  async function handleUpdate(formData: Record<string, unknown>) {
    if (!editingRecord) return;

    const res = await fetch(`/api/runtime/${entityName}/${editingRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!data.success) {
      if (data.details) throw new FieldValidationError(data.details);
      throw new Error(data.error ?? "Failed to update record");
    }

    setEditingRecord(null);
    await loadRecords();
    setActiveTab("records");
  }

  // ─── Delete record ────────────────────────────────────────────────────────────
  async function handleDelete(record: StoredRecord) {
    await fetch(`/api/runtime/${entityName}/${record.id}`, { method: "DELETE" });
    await loadRecords(pagination.page);
  }

  // ─── Edit record ──────────────────────────────────────────────────────────────
  function handleEdit(record: StoredRecord) {
    setEditingRecord(record);
    setActiveTab("add"); // reuse the form tab for editing
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (isLoadingSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="p-8">
      {/* Breadcrumb header */}
      <div className="mb-8">
        <Link
          href="/dashboard/schemas"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Schemas
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-900/30 p-2">
            <Database className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{schema.title}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              <code className="font-mono">{entityName}</code> · {pagination.total} total records
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1 w-fit">
        {[
          { key: "records" as Tab, label: "Records", icon: Database },
          { key: "add" as Tab, label: editingRecord ? "Edit Record" : "Add Record", icon: editingRecord ? Pencil : Plus },
          { key: "import" as Tab, label: "Import CSV", icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key !== "add") setEditingRecord(null);
            }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
              activeTab === key
                ? "bg-indigo-600 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        {activeTab === "records" && (
          <div>
            {isLoadingRecords ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : (
              <DynamicTable
                schema={schema}
                records={records}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={{
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                  total: pagination.total,
                  onPageChange: loadRecords,
                }}
              />
            )}
          </div>
        )}

        {activeTab === "add" && (
          <div className="max-w-lg">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {editingRecord ? "Edit Record" : `Add ${schema.title} Record`}
              </h2>
              {editingRecord && (
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setActiveTab("records");
                  }}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <DynamicForm
              schema={schema}
              onSubmit={editingRecord ? handleUpdate : handleCreate}
              initialValues={editingRecord ? (editingRecord.dataJson as Record<string, unknown>) : {}}
              submitLabel={editingRecord ? "Save Changes" : "Add Record"}
            />
          </div>
        )}

        {activeTab === "import" && (
          <div className="max-w-lg">
            <h2 className="mb-5 font-semibold text-white">Import from CSV</h2>
            <CsvImporter
              schema={schema}
              entityName={entityName}
              onSuccess={() => {
                setActiveTab("records");
                loadRecords();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
