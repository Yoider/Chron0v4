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
    const { title, goalId, status } = body;

    if (!title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        goalId: goalId || null,
        status: status || "PENDING",
      },
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }
}
