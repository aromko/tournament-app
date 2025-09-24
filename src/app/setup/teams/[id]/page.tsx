import React, { Suspense } from "react";
import TeamsAssignment, { type Player } from "./TeamsAssignment";
import { getPlayersByTournamentId } from "@/prisma/db/player";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  // Guard: redirect if tournament was started
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { started: true } });
  if (t?.started) {
    redirect("/");
  }

  const dbPlayers = await getPlayersByTournamentId(tournamentId);
  const players: Player[] = dbPlayers.map((p) => ({
    id: String(p.id),
    name: p.name,
    groupNumber: p.groupNumber ?? null,
  }));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamsAssignment players={players} />
    </Suspense>
  );
}
