import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-current-user";
import { buildRecordValidator, formatRecordErrors } from "@/lib/validators/record-validator";
import type { EntitySchema } from "@/lib/types";

// GET /api/runtime/[entity] - list all records for an entity
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { entity } = await params;

    // Pagination via query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    // Make sure the schema exists for this user
    const schema = await prisma.entityConfig.findFirst({
      where: { name: entity, userId: user.userId },
    });

    if (!schema) {
      return NextResponse.json(
        { success: false, error: `No schema found for entity: ${entity}` },
        { status: 404 }
      );
    }

    // Fetch records + total count in parallel for efficiency
    const [records, total] = await Promise.all([
      prisma.entityRecord.findMany({
        where: { entityName: entity, userId: user.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.entityRecord.count({
        where: { entityName: entity, userId: user.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/runtime/[entity] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load records" }, { status: 500 });
  }
}

// POST /api/runtime/[entity] - create a new record
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { entity } = await params;
    const body = await req.json();

    // Load the schema to know what fields and validation rules to apply
    const schemaConfig = await prisma.entityConfig.findFirst({
      where: { name: entity, userId: user.userId },
    });

    if (!schemaConfig) {
      return NextResponse.json(
        { success: false, error: `No schema found for entity: ${entity}` },
        { status: 404 }
      );
    }

    // Get the fields from the stored schema JSON
    const entitySchema = schemaConfig.schemaJson as unknown as EntitySchema;
    const fields = entitySchema.fields ?? [];

    // Dynamically build and run validation
    const validator = buildRecordValidator(fields);
    const result = validator.safeParse(body);

    if (!result.success) {
      const fieldErrors = formatRecordErrors(result.error);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: fieldErrors },
        { status: 422 }
      );
    }

    // Save the record
    const record = await prisma.entityRecord.create({
      data: {
        entityName: entity,
        dataJson: result.data as object,
        userId: user.userId,
        entityId: schemaConfig.id,
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("POST /api/runtime/[entity] error:", error);
    return NextResponse.json({ success: false, error: "Failed to create record" }, { status: 500 });
  }
}
