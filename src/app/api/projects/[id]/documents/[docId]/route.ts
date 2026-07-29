import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
  docId: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { docId } = await params;
    const body = await request.json();
    const { title, type, content } = body;

    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: title !== undefined ? title : doc.title,
        type: type !== undefined ? type : doc.type,
        content: content !== undefined ? content : doc.content,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PUT /api/projects/[id]/documents/[docId] error:", error);
    return Response.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { docId } = await params;

    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    return Response.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/documents/[docId] error:", error);
    return Response.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
