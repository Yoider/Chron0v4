import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
  taskId: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { title, status, goalId } = body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : task.title,
        status: status !== undefined ? status : task.status,
        goalId: goalId !== undefined ? goalId : task.goalId,
      },
    });

    // Automatically update the goal's progress when a task's status changes
    if (updated.goalId) {
      const associatedTasks = await prisma.task.findMany({
        where: { goalId: updated.goalId },
      });
      const completedCount = associatedTasks.filter((t) => t.status === "COMPLETED").length;
      const progress = associatedTasks.length > 0
        ? (completedCount / associatedTasks.length) * 100
        : 0;

      await prisma.goal.update({
        where: { id: updated.goalId },
        data: { progress },
      });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("PUT /api/projects/[id]/tasks/[taskId] error:", error);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Automatically update goal progress if task was deleted
    if (task.goalId) {
      const associatedTasks = await prisma.task.findMany({
        where: { goalId: task.goalId },
      });
      const completedCount = associatedTasks.filter((t) => t.status === "COMPLETED").length;
      const progress = associatedTasks.length > 0
        ? (completedCount / associatedTasks.length) * 100
        : 0;

      await prisma.goal.update({
        where: { id: task.goalId },
        data: { progress },
      });
    }

    return Response.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/tasks/[taskId] error:", error);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
