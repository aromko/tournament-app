import { NextRequest, NextResponse } from "next/server";
import { performStartTournament } from "@/app/setup/action";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ message: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = await req.json().catch(() => null) as { tournamentId?: unknown } | null;
    const tidRaw = body?.tournamentId;
    const tournamentId = typeof tidRaw === "number" ? tidRaw : typeof tidRaw === "string" ? parseInt(tidRaw, 10) : NaN;
    if (!Number.isFinite(tournamentId)) {
      return NextResponse.json({ message: "Invalid tournament ID" }, { status: 400 });
    }

    await performStartTournament(tournamentId);
    return NextResponse.json({ ok: true, tournamentId });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
