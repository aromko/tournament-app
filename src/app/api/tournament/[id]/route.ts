import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const idNum = parseInt(params.id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  try {
    const t = await prisma.tournament.findUnique({ where: { id: idNum } });
    if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: t.id,
      name: t.name,
      eliminationType: t.eliminationType,
      numberOfGroups: t.numberOfGroups,
    });
  } catch (e) {
    return NextResponse.json({ message: `Error: ${e}` }, { status: 500 });
  }
}
