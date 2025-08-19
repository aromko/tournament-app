import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const players = await prisma.player.findMany({
      where: { tournamentId: idNum },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json(players);
  } catch (e) {
    return NextResponse.json({ message: `Error: ${e}` }, { status: 500 });
  }
}
