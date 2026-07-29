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
    const { lastState, nextSteps } = body;

    if (!lastState || !nextSteps) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.traceLog.create({
      data: {
        projectId,
        lastState,
        nextSteps,
      },
    });

    return Response.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects/[id]/tracelog error:", error);
    return Response.json({ error: "Failed to create trace log" }, { status: 500 });
  }
}
