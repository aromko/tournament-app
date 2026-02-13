import prisma from "@/lib/prisma";
import {
  ensureStandingsForTournament,
  getStandingsByTournamentId,
  sortStandings,
} from "@/prisma/db/standing";
import {
  ensureMatchesForTournament,
  getMatchesByTournamentId,
} from "@/prisma/db/match";
import TournamentView from "./TournamentView";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournamentId = Number(id);

  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, numberOfGroups: true },
  });

  if (!t) {
    return <div className="p-4">Tournament not found</div>;
  }

  await ensureStandingsForTournament(tournamentId);
  await ensureMatchesForTournament(tournamentId);

  const allStandings = await getStandingsByTournamentId(tournamentId);
  const allMatches = await getMatchesByTournamentId(tournamentId);

  const groupStandings: Record<number, typeof allStandings> = {};
  for (let g = 1; g <= t.numberOfGroups; g++) groupStandings[g] = [];
  for (const row of allStandings) {
    const g = row.groupNumber ?? 1;
    (groupStandings[g] ||= []).push(row);
  }
  for (const g of Object.keys(groupStandings)) {
    groupStandings[Number(g)] = sortStandings(groupStandings[Number(g)]);
  }

  const groupMatches: Record<number, typeof allMatches> = {};
  for (let g = 1; g <= t.numberOfGroups; g++) groupMatches[g] = [];
  for (const row of allMatches) {
    (groupMatches[row.groupNumber] ||= []).push(row);
  }

  return (
    <TournamentView
      tournamentName={t.name}
      tournamentId={t.id}
      numberOfGroups={t.numberOfGroups}
      groupStandings={groupStandings}
      groupMatches={groupMatches}
    />
  );
}
