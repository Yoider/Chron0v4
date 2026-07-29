import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        traceLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        goals: true,
        tasks: true,
      },
    });

    return Response.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return Response.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
      },
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }
}
