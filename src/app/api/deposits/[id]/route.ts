import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon, color, allocated } = body;

    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return Response.json({ error: "Depósito no encontrado" }, { status: 404 });
    }

    if (deposit.userId !== session.user.id) {
      return Response.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        name: name !== undefined ? name : deposit.name,
        icon: icon !== undefined ? icon : deposit.icon,
        color: color !== undefined ? color : deposit.color,
        allocated: allocated !== undefined ? parseFloat(allocated) : deposit.allocated,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PUT /api/deposits/[id] error:", error);
    return Response.json({ error: "Error al actualizar depósito" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return Response.json({ error: "Depósito no encontrado" }, { status: 404 });
    }

    if (deposit.userId !== session.user.id) {
      return Response.json({ error: "Acceso denegado" }, { status: 403 });
    }

    await prisma.deposit.delete({
      where: { id },
    });

    return Response.json({ message: "Depósito eliminado con éxito" });
  } catch (error) {
    console.error("DELETE /api/deposits/[id] error:", error);
    return Response.json({ error: "Error al eliminar depósito" }, { status: 500 });
  }
}
