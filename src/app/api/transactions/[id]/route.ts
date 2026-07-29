import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    if (transaction.userId !== session.user.id) {
      return Response.json({ error: "Acceso denegado" }, { status: 403 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return Response.json({ message: "Transacción eliminada con éxito" });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return Response.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, recurrence } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    if (transaction.userId !== session.user.id) {
      return Response.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: status !== undefined ? status : transaction.status,
        recurrence: recurrence !== undefined ? recurrence : transaction.recurrence,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/transactions/[id] error:", error);
    return Response.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
