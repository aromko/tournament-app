import React, { Suspense } from "react";
import TeamsAssignment, { type Player } from "./TeamsAssignment";
import { getPlayersByTournamentId } from "@/prisma/db/player";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);
  const dbPlayers = await getPlayersByTournamentId(tournamentId);
  const players: Player[] = dbPlayers.map((p) => ({
    id: String(p.id),
    name: p.name,
  }));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamsAssignment players={players} />
    </Suspense>
  );
}
