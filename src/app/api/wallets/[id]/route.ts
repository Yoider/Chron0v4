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

    const wallet = await prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      return Response.json({ error: "Billetera no encontrada" }, { status: 404 });
    }

    if (wallet.userId !== session.user.id) {
      return Response.json({ error: "Acceso denegado" }, { status: 403 });
    }

    await prisma.wallet.delete({
      where: { id },
    });

    return Response.json({ message: "Billetera eliminada con éxito" });
  } catch (error) {
    console.error("DELETE /api/wallets/[id] error:", error);
    return Response.json({ error: "Failed to delete wallet" }, { status: 500 });
  }
}
