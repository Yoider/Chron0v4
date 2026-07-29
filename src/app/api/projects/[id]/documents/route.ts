import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, type, content } = body;

    if (!title || !type || content === undefined) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        projectId,
        title,
        type,
        content,
      },
    });

    return Response.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/documents error:", error);
    return Response.json({ error: "Failed to create document" }, { status: 500 });
  }
}
