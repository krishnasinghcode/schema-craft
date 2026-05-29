import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { entitySchemaValidator, formatZodError } from "@/lib/validators/schema-validator";

// GET /api/schemas - list all schemas for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const schemas = await prisma.entityConfig.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      // Count records for each schema so we can show it in the UI
      include: {
        _count: { select: { records: true } },
      },
    });

    return NextResponse.json({ success: true, data: schemas });
  } catch (error) {
    console.error("GET /api/schemas error:", error);
    return NextResponse.json({ success: false, error: "Failed to load schemas" }, { status: 500 });
  }
}

// POST /api/schemas - create a new schema
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate the uploaded schema structure
    const result = entitySchemaValidator.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const schema = result.data;

    // Check if user already has a schema with this entity name
    const existing = await prisma.entityConfig.findUnique({
      where: { name_userId: { name: schema.entity, userId: user.userId } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `You already have a schema named "${schema.entity}". Use a different entity name.` },
        { status: 409 }
      );
    }

    // Save the schema
    const created = await prisma.entityConfig.create({
      data: {
        name: schema.entity,
        title: schema.title,
        schemaJson: schema as object,
        userId: user.userId,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/schemas error:", error);
    return NextResponse.json({ success: false, error: "Failed to save schema" }, { status: 500 });
  }
}
