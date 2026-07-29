import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

// GET /api/projects/[id] - Get a project by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        traceLogs: {
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        goals: {
          orderBy: { createdAt: "desc" },
          include: {
            tasks: true,
          },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error(`GET /api/projects/[id] error:`, error);
    return Response.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : project.name,
        description: description !== undefined ? description : project.description,
      },
    });

    return Response.json(updatedProject);
  } catch (error) {
    console.error(`PUT /api/projects/[id] error:`, error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return Response.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(`DELETE /api/projects/[id] error:`, error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
