import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { entitySchemaValidator, formatZodError } from "@/lib/validators/schema-validator";

// GET /api/schemas/[id] - get one schema
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const schema = await prisma.entityConfig.findFirst({
      where: { id, userId: user.userId }, // userId check ensures users can only see their own
    });

    if (!schema) {
      return NextResponse.json({ success: false, error: "Schema not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: schema });
  } catch (error) {
    console.error("GET /api/schemas/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load schema" }, { status: 500 });
  }
}

// PUT /api/schemas/[id] - update a schema
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Make sure schema exists and belongs to user
    const existing = await prisma.entityConfig.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Schema not found" }, { status: 404 });
    }

    const result = entitySchemaValidator.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const schema = result.data;

    const updated = await prisma.entityConfig.update({
      where: { id },
      data: {
        title: schema.title,
        schemaJson: schema as object,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/schemas/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update schema" }, { status: 500 });
  }
}

// DELETE /api/schemas/[id] - delete a schema and all its records
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.entityConfig.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Schema not found" }, { status: 404 });
    }

    // Prisma cascades and deletes records too (defined in schema)
    await prisma.entityConfig.delete({ where: { id } });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("DELETE /api/schemas/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete schema" }, { status: 500 });
  }
}
