"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Database, Plus, ArrowRight, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SchemaWithCount {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  _count: { records: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [schemas, setSchemas] = useState<SchemaWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSchemas() {
      try {
        const res = await fetch("/api/schemas");
        const data = await res.json();
        if (data.success) {
          setSchemas(data.data);
        }
      } catch {
        // ignore — user sees empty state
      } finally {
        setIsLoading(false);
      }
    }
    loadSchemas();
  }, []);

  const totalRecords = schemas.reduce((sum, s) => sum + s._count.records, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Here&apos;s what&apos;s happening with your schemas.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Total Schemas", value: schemas.length, icon: Database },
          { label: "Total Records", value: totalRecords, icon: Database },
          { label: "Field Types", value: 8, icon: Database },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">{label}</p>
              <Icon className="h-4 w-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent schemas */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-white">Your Schemas</h2>
          <Link
            href="/dashboard/schemas"
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : schemas.length === 0 ? (
          <div className="py-12 text-center">
            <Database className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 mb-1">No schemas yet</p>
            <p className="text-sm text-zinc-600 mb-4">Create your first schema to get started</p>
            <Link
              href="/dashboard/schemas"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              <Plus className="h-4 w-4" />
              Create Schema
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {schemas.slice(0, 5).map((schema) => (
              <Link
                key={schema.id}
                href={`/dashboard/entity/${schema.name}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition group"
              >
                <div>
                  <p className="font-medium text-white group-hover:text-indigo-300 transition">
                    {schema.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    <code className="font-mono">{schema.name}</code> · Created {formatDate(schema.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-400">
                    {schema._count.records} record{schema._count.records !== 1 ? "s" : ""}
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
