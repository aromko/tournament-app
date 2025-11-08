import prisma from "@/lib/prisma";

export type StandingRow = {
  id: number;
  tournamentId: number;
  playerId: number;
  groupNumber: number;
  games: number;
  wins: number;
  losses: number;
  diff: number;
  points: number;
  rank: number | null;
  player: { id: number; name: string };
};

export async function getStandingsByTournamentId(tournamentId: number): Promise<StandingRow[]> {
  return (prisma as any).groupStanding.findMany({
    where: { tournamentId },
    include: { player: { select: { id: true, name: true } } },
  }) as any;
}

export async function ensureStandingsForTournament(tournamentId: number): Promise<void> {
  // Ensure there is a standing row per player in the tournament and initialize default ranks
  await prisma.$transaction(async (tx) => {
    const players = await tx.player.findMany({ where: { tournamentId }, select: { id: true, groupNumber: true } });
    if (players.length === 0) return;

    // Use transaction delegate when available; fall back to root client to avoid runtime undefined
    const gs = ((tx as any).groupStanding ?? (prisma as any).groupStanding) as any;

    const existing = await gs.findMany({ where: { tournamentId }, select: { playerId: true } });
    const existingSet = new Set(existing.map((e: any) => e.playerId));

    const toCreate = players.filter((p) => !existingSet.has(p.id));
    if (toCreate.length > 0) {
      await gs.createMany({
        data: toCreate.map((p) => ({
          tournamentId,
          playerId: p.id,
          groupNumber: p.groupNumber ?? 1,
        })),
        skipDuplicates: true,
      });
    }

    // Initialize rank values by player name ascending per group if not set
    const standings = await gs.findMany({
      where: { tournamentId },
      include: { player: { select: { name: true } } },
    });

    // Only assign ranks if there are any rows without a rank yet
    if (standings.some((s: any) => s.rank == null)) {
      const byGroup = new Map<number, any[]>();
      for (const row of standings) {
        const g = row.groupNumber ?? 1;
        if (!byGroup.has(g)) byGroup.set(g, [] as any);
        (byGroup.get(g) as any).push(row);
      }

      for (const [_, list] of byGroup) {
        (list as any[]).sort((a: any, b: any) => a.player.name.localeCompare(b.player.name));
        for (let i = 0; i < list.length; i++) {
          const row = list[i] as any;
          if (row.rank == null) {
            await gs.update({ where: { id: row.id }, data: { rank: i + 1 } });
          }
        }
      }
    }
  });
}

export function sortStandings(rows: StandingRow[]): StandingRow[] {
  // Sort by rank if present, else by points desc, diff desc, wins desc, name asc
  return [...rows].sort((a, b) => {
    if (a.rank != null && b.rank != null) return a.rank - b.rank;
    if (a.rank != null) return -1;
    if (b.rank != null) return 1;

    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.player.name.localeCompare(b.player.name);
  });
}
