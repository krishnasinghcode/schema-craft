import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { buildRecordValidator, formatRecordErrors } from "@/lib/validators/record-validator";
import type { EntitySchema } from "@/lib/types";

// GET /api/runtime/[entity]/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { entity, id } = await params;

    const record = await prisma.entityRecord.findFirst({
      where: { id, entityName: entity, userId: user.userId },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("GET record error:", error);
    return NextResponse.json({ success: false, error: "Failed to load record" }, { status: 500 });
  }
}

// PUT /api/runtime/[entity]/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { entity, id } = await params;
    const body = await req.json();

    // Find the record
    const existing = await prisma.entityRecord.findFirst({
      where: { id, entityName: entity, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // Load schema for validation
    const schemaConfig = await prisma.entityConfig.findFirst({
      where: { name: entity, userId: user.userId },
    });
    if (!schemaConfig) {
      return NextResponse.json({ success: false, error: "Schema not found" }, { status: 404 });
    }

    const entitySchema = schemaConfig.schemaJson as unknown as EntitySchema;
    const validator = buildRecordValidator(entitySchema.fields ?? []);
    const result = validator.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: formatRecordErrors(result.error) },
        { status: 422 }
      );
    }

    const updated = await prisma.entityRecord.update({
      where: { id },
      data: { dataJson: result.data as object },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT record error:", error);
    return NextResponse.json({ success: false, error: "Failed to update record" }, { status: 500 });
  }
}

// DELETE /api/runtime/[entity]/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { entity, id } = await params;

    const existing = await prisma.entityRecord.findFirst({
      where: { id, entityName: entity, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    await prisma.entityRecord.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("DELETE record error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete record" }, { status: 500 });
  }
}
