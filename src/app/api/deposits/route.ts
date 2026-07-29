import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(deposits);
  } catch (error) {
    console.error("GET /api/deposits error:", error);
    return Response.json({ error: "Error al obtener depósitos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, icon, color, allocated } = body;

    if (!name) {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const deposit = await prisma.deposit.create({
      data: {
        name,
        icon: icon || "📦",
        color: color || "purple",
        allocated: parseFloat(allocated || 0),
        userId: session.user.id,
      },
    });

    return Response.json(deposit);
  } catch (error) {
    console.error("POST /api/deposits error:", error);
    return Response.json({ error: "Error al crear depósito" }, { status: 500 });
  }
}
