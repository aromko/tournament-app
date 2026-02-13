import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const name = (body as { name?: unknown })?.name;
  if (typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  try {
    const created = await prisma.player.create({
      data: { name: name.trim(), tournamentId: idNum },
      select: { id: true, name: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: `Error: ${e}` }, { status: 500 });
  }
}
