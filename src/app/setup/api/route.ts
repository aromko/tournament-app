import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const requestData = await req.json();
  const newTournament = await prisma!.tournament.create({
    data: {
      name: requestData.name,
      eliminationType: requestData.eliminationType,
      numberOfGroups: requestData.numberOfGroups,
    },
  });
  return NextResponse.json({ tournament: newTournament.id }, { status: 200 });
}
