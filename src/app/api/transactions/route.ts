import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      include: {
        project: {
          select: { name: true },
        },
        wallet: {
          select: { name: true, icon: true },
        },
        deposit: {
          select: { name: true, icon: true, color: true },
        },
      },
    });

    return Response.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, category, description, date, projectId, walletId, icon, recurrence, status, depositId } = body;

    if (amount === undefined || !type || !walletId) {
      return Response.json({ error: "Faltan campos requeridos (monto, tipo o billetera)" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        walletId: walletId,
        depositId: depositId || null,
        amount: parseFloat(amount),
        type,
        category: category || "General",
        icon: icon ? icon.trim() : "💸",
        recurrence: recurrence || null,
        status: status || "PAID",
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return Response.json(transaction, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return Response.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
