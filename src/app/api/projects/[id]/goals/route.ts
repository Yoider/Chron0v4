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
    const { title, description } = body;

    if (!title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        projectId,
        title,
        description,
        progress: 0.0,
      },
    });

    return Response.json(goal, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/goals error:", error);
    return Response.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
