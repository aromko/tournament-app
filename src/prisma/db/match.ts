import prisma from "@/lib/prisma";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type MatchRow = {
  id: number;
  tournamentId: number;
  groupNumber: number;
  player1Id: number;
  player2Id: number;
  score1: number | null;
  score2: number | null;
  played: boolean;
  player1: { id: number; name: string };
  player2: { id: number; name: string };
};

export async function getMatchesByTournamentId(
  tournamentId: number,
): Promise<MatchRow[]> {
  return (prisma as any).match.findMany({
    where: { tournamentId },
    include: {
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
    },
    orderBy: [{ groupNumber: "asc" }, { id: "asc" }],
  }) as any;
}

export async function ensureMatchesForTournament(
  tournamentId: number,
): Promise<void> {
  await prisma.$transaction(async (tx: TransactionClient) => {
    const players = await tx.player.findMany({
      where: { tournamentId },
      select: { id: true, groupNumber: true },
    });
    if (players.length === 0) return;

    const matchModel = ((tx as any).match ?? (prisma as any).match) as any;

    // Group players by groupNumber
    const byGroup = new Map<number, number[]>();
    for (const p of players) {
      const g = p.groupNumber ?? 1;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(p.id);
    }

    // Generate C(n,2) combinations per group with canonical ordering
    const toCreate: {
      tournamentId: number;
      groupNumber: number;
      player1Id: number;
      player2Id: number;
    }[] = [];

    for (const [groupNumber, playerIds] of byGroup) {
      const sorted = [...playerIds].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          toCreate.push({
            tournamentId,
            groupNumber,
            player1Id: sorted[i],
            player2Id: sorted[j],
          });
        }
      }
    }

    if (toCreate.length > 0) {
      await matchModel.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }
  });
}

export async function recalculateStandings(
  tournamentId: number,
  groupNumber: number,
): Promise<void> {
  await prisma.$transaction(async (tx: TransactionClient) => {
    const matchModel = ((tx as any).match ?? (prisma as any).match) as any;
    const gs = ((tx as any).groupStanding ??
      (prisma as any).groupStanding) as any;

    const matches = await matchModel.findMany({
      where: { tournamentId, groupNumber, played: true },
    });

    // Compute stats per player
    const stats = new Map<
      number,
      { games: number; wins: number; losses: number; diff: number }
    >();

    const initPlayer = (id: number) => {
      if (!stats.has(id)) {
        stats.set(id, { games: 0, wins: 0, losses: 0, diff: 0 });
      }
    };

    for (const m of matches) {
      initPlayer(m.player1Id);
      initPlayer(m.player2Id);

      const s1 = stats.get(m.player1Id)!;
      const s2 = stats.get(m.player2Id)!;

      s1.games++;
      s2.games++;

      const diff = (m.score1 ?? 0) - (m.score2 ?? 0);
      s1.diff += diff;
      s2.diff -= diff;

      if ((m.score1 ?? 0) > (m.score2 ?? 0)) {
        s1.wins++;
        s2.losses++;
      } else {
        s2.wins++;
        s1.losses++;
      }
    }

    // Get all standings for this group
    const standings = await gs.findMany({
      where: { tournamentId, groupNumber },
      include: { player: { select: { name: true } } },
    });

    // Update each standing row with computed stats
    type StandingWithStats = {
      id: number;
      playerId: number;
      games: number;
      wins: number;
      losses: number;
      diff: number;
      points: number;
      player: { name: string };
    };

    const updated: StandingWithStats[] = standings.map((s: any) => {
      const st = stats.get(s.playerId) ?? {
        games: 0,
        wins: 0,
        losses: 0,
        diff: 0,
      };
      return {
        ...s,
        games: st.games,
        wins: st.wins,
        losses: st.losses,
        diff: st.diff,
        points: st.wins * 2,
      };
    });

    // Sort for ranking: points desc, diff desc, wins desc, name asc
    updated.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.player.name.localeCompare(b.player.name);
    });

    // Batch update all rows
    await Promise.all(
      updated.map((row, idx) =>
        gs.update({
          where: { id: row.id },
          data: {
            games: row.games,
            wins: row.wins,
            losses: row.losses,
            diff: row.diff,
            points: row.points,
            rank: idx + 1,
          },
        }),
      ),
    );
  });
}
