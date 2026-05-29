import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { buildRecordValidator } from "@/lib/validators/record-validator";
import type { EntitySchema } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { entity } = await params;

    const schemaConfig = await prisma.entityConfig.findFirst({
      where: { name: entity, userId: user.userId },
    });
    if (!schemaConfig) {
      return NextResponse.json({ success: false, error: "Schema not found" }, { status: 404 });
    }

    const entitySchema = schemaConfig.schemaJson as unknown as EntitySchema;
    const validator = buildRecordValidator(entitySchema.fields ?? []);

    const body = await req.json();
    const rows: unknown[] = body.rows ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No rows provided" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { success: false, error: "Maximum 500 rows per import" },
        { status: 400 }
      );
    }

    const successes: number[] = [];
    const failures: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const result = validator.safeParse(row);

      if (!result.success) {
        const firstIssue = result.error.issues[0];
        failures.push({ row: i + 1, error: firstIssue?.message ?? "Validation failed" });
        continue;
      }

      await prisma.entityRecord.create({
        data: {
          entityName: entity,
          dataJson: result.data as object,
          userId: user.userId,
          entityId: schemaConfig.id,
        },
      });

      successes.push(i + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: successes.length,
        failed: failures.length,
        failures,
      },
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ success: false, error: "Import failed" }, { status: 500 });
  }
}
