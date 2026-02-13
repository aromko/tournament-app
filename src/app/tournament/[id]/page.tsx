import prisma from "@/lib/prisma";
import {
  ensureStandingsForTournament,
  getStandingsByTournamentId,
  sortStandings,
} from "@/prisma/db/standing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const allStandings = await getStandingsByTournamentId(tournamentId);

  const groups: Record<number, typeof allStandings> = {};
  for (let g = 1; g <= t.numberOfGroups; g++) groups[g] = [];
  for (const row of allStandings) {
    const g = row.groupNumber ?? 1;
    (groups[g] ||= []).push(row);
  }

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-semibold">{t.name}</h1>
      {Array.from({ length: t.numberOfGroups }, (_, i) => i + 1).map(
        (groupNo) => {
          const rows = sortStandings(groups[groupNo] || []);
          return (
            <div key={groupNo} className="space-y-2">
              <h2 className="text-xl font-medium">Group {groupNo}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Rank</TableHead>
                    <TableHead className="w-[40%]">Player</TableHead>
                    <TableHead className="w-[10%]">Games</TableHead>
                    <TableHead className="w-[15%]">Win/Loss</TableHead>
                    <TableHead className="w-[10%]">Diff</TableHead>
                    <TableHead className="w-[15%]">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No players in this group.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(
                      (
                        { id, rank, player, games, wins, losses, diff, points },
                        idx,
                      ) => (
                        <TableRow key={id}>
                          <TableCell>{rank ?? idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {player.name}
                          </TableCell>
                          <TableCell>{games}</TableCell>
                          <TableCell>
                            {wins}:{losses}
                          </TableCell>
                          <TableCell>{diff}</TableCell>
                          <TableCell>{points}</TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          );
        },
      )}
    </div>
  );
}
