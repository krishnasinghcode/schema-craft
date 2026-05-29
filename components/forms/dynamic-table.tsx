"use client";

import { useState } from "react";
import type { EntitySchema, StoredRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface DynamicTableProps {
  schema: EntitySchema;
  records: StoredRecord[];
  onEdit: (record: StoredRecord) => void;
  onDelete: (record: StoredRecord) => void;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DynamicTable({ schema, records, onEdit, onDelete, pagination }: DynamicTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Only show the first 6 fields in the table to avoid overflow
  // The user can still see all fields in the edit form
  const visibleFields = schema.fields.slice(0, 6);

  async function handleDelete(record: StoredRecord) {
    if (!confirm(`Delete this record? This cannot be undone.`)) return;
    setDeletingId(record.id);
    try {
      await onDelete(record);
    } finally {
      setDeletingId(null);
    }
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
        <p className="text-zinc-400">No records yet.</p>
        <p className="mt-1 text-sm text-zinc-600">Use the form to add your first record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              {visibleFields.map((field) => (
                <th
                  key={field.name}
                  className="px-4 py-3 text-left font-medium text-zinc-400 whitespace-nowrap"
                >
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-zinc-400 whitespace-nowrap">
                Created
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {records.map((record) => {
              const data = record.dataJson as Record<string, unknown>;
              return (
                <tr
                  key={record.id}
                  className="bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
                >
                  {visibleFields.map((field) => (
                    <td key={field.name} className="px-4 py-3 text-zinc-300">
                      <CellValue value={data[field.name]} fieldType={field.type} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap text-xs">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(record)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-indigo-900/30 transition"
                        title="Edit record"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(record)}
                        disabled={deletingId === record.id}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-900/30 transition disabled:opacity-50"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>{pagination.total} total records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Renders a cell value in a human-readable way
function CellValue({ value, fieldType }: { value: unknown; fieldType: string }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-zinc-600 italic">—</span>;
  }

  if (fieldType === "checkbox") {
    return (
      <span className={value ? "text-green-400" : "text-zinc-600"}>
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (fieldType === "password") {
    return <span className="text-zinc-600">••••••</span>;
  }

  const str = String(value);
  // Truncate long values in the table
  return <span>{str.length > 50 ? str.slice(0, 50) + "…" : str}</span>;
}
