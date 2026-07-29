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

    const wallets = await prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return Response.json(wallets);
  } catch (error) {
    console.error("GET /api/wallets error:", error);
    return Response.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon } = body;

    if (!name || name.trim() === "") {
      return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        icon: icon ? icon.trim() : "💳",
      },
    });

    return Response.json(wallet, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallets error:", error);
    return Response.json({ error: "Failed to create wallet" }, { status: 500 });
  }
}
