import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
  goalId: string;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { goalId } = await params;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return Response.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return Response.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/goals/[goalId] error:", error);
    return Response.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
