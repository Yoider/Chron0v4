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
    const transfers = await prisma.transfer.findMany({
      where: { userId: session.user.id },
      include: {
        fromWallet: true,
        toWallet: true,
        fromDeposit: true,
        toDeposit: true,
      },
      orderBy: { date: "desc" },
    });
    return Response.json(transfers);
  } catch (error) {
    console.error("GET /api/transfers error:", error);
    return Response.json({ error: "Error al obtener transferencias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      amount,
      description,
      fromWalletId,
      fromDepositId,
      fromPozo,
      toWalletId,
      toDepositId,
      toPozo,
    } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: "Monto no válido" }, { status: 400 });
    }

    // Database Transaction to ensure transfer and allocation updates occur together
    const result = await prisma.$transaction(async (tx) => {
      // 1. If source is a Deposit, decrement its allocated budget
      if (fromDepositId) {
        const deposit = await tx.deposit.findUnique({
          where: { id: fromDepositId },
        });
        if (!deposit || deposit.userId !== session.user.id) {
          throw new Error("Depósito de origen no encontrado o no autorizado");
        }
        await tx.deposit.update({
          where: { id: fromDepositId },
          data: { allocated: { decrement: parsedAmount } },
        });
      }

      // 2. If target is a Deposit, increment its allocated budget
      if (toDepositId) {
        const deposit = await tx.deposit.findUnique({
          where: { id: toDepositId },
        });
        if (!deposit || deposit.userId !== session.user.id) {
          throw new Error("Depósito de destino no encontrado o no autorizado");
        }
        await tx.deposit.update({
          where: { id: toDepositId },
          data: { allocated: { increment: parsedAmount } },
        });
      }

      // 3. Create the Transfer record
      const newTransfer = await tx.transfer.create({
        data: {
          userId: session.user.id,
          amount: parsedAmount,
          description: description || "Traspaso de dinero",
          fromWalletId: fromWalletId || null,
          fromDepositId: fromDepositId || null,
          fromPozo: !!fromPozo,
          toWalletId: toWalletId || null,
          toDepositId: toDepositId || null,
          toPozo: !!toPozo,
        },
      });

      return newTransfer;
    });

    return Response.json(result);
  } catch (error: any) {
    console.error("POST /api/transfers error:", error);
    return Response.json({ error: error.message || "Error al realizar la transferencia" }, { status: 500 });
  }
}
