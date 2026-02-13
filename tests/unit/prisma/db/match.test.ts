import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  tx: {
    player: {
      findMany: vi.fn(),
    },
    match: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    groupStanding: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: h.prisma,
}));

describe("match DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.prisma.$transaction.mockImplementation(async (cb: any) => cb(h.tx));
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("ensureMatchesForTournament", () => {
    it("does nothing when there are no players", async () => {
      const { ensureMatchesForTournament } = await import(
        "@/prisma/db/match"
      );

      h.tx.player.findMany.mockResolvedValueOnce([]);

      await ensureMatchesForTournament(1);

      expect(h.tx.match.createMany).not.toHaveBeenCalled();
    });

    it("generates C(n,2) round-robin match combinations per group", async () => {
      const { ensureMatchesForTournament } = await import(
        "@/prisma/db/match"
      );

      h.tx.player.findMany.mockResolvedValueOnce([
        { id: 1, groupNumber: 1 },
        { id: 2, groupNumber: 1 },
        { id: 3, groupNumber: 1 },
        { id: 4, groupNumber: 2 },
        { id: 5, groupNumber: 2 },
      ]);
      h.tx.match.createMany.mockResolvedValueOnce({ count: 4 });

      await ensureMatchesForTournament(10);

      expect(h.tx.match.createMany).toHaveBeenCalledTimes(1);
      const { data, skipDuplicates } =
        h.tx.match.createMany.mock.calls[0][0];

      // Group 1: C(3,2) = 3 matches; Group 2: C(2,2) = 1 match
      expect(data).toHaveLength(4);
      expect(skipDuplicates).toBe(true);

      // Verify canonical ordering (player1Id < player2Id)
      for (const m of data) {
        expect(m.player1Id).toBeLessThan(m.player2Id);
        expect(m.tournamentId).toBe(10);
      }

      // Group 1 matches: 1v2, 1v3, 2v3
      const g1 = data.filter(
        (m: any) => m.groupNumber === 1,
      );
      expect(g1).toHaveLength(3);
      expect(g1.map((m: any) => `${m.player1Id}v${m.player2Id}`)).toEqual([
        "1v2",
        "1v3",
        "2v3",
      ]);

      // Group 2 matches: 4v5
      const g2 = data.filter(
        (m: any) => m.groupNumber === 2,
      );
      expect(g2).toHaveLength(1);
      expect(g2[0].player1Id).toBe(4);
      expect(g2[0].player2Id).toBe(5);
    });

    it("defaults null groupNumber to 1", async () => {
      const { ensureMatchesForTournament } = await import(
        "@/prisma/db/match"
      );

      h.tx.player.findMany.mockResolvedValueOnce([
        { id: 1, groupNumber: null },
        { id: 2, groupNumber: null },
      ]);
      h.tx.match.createMany.mockResolvedValueOnce({ count: 1 });

      await ensureMatchesForTournament(5);

      const { data } = h.tx.match.createMany.mock.calls[0][0];
      expect(data).toHaveLength(1);
      expect(data[0].groupNumber).toBe(1);
    });
  });

  describe("recalculateStandings", () => {
    it("computes stats from played matches and updates standings with ranks", async () => {
      const { recalculateStandings } = await import("@/prisma/db/match");

      // Two played matches in group 1:
      // Player 1 beat Player 2 (11-7)
      // Player 1 beat Player 3 (11-5)
      h.tx.match.findMany.mockResolvedValueOnce([
        { player1Id: 1, player2Id: 2, score1: 11, score2: 7, played: true },
        { player1Id: 1, player2Id: 3, score1: 11, score2: 5, played: true },
      ]);

      h.tx.groupStanding.findMany.mockResolvedValueOnce([
        { id: 100, playerId: 1, player: { name: "Alice" } },
        { id: 101, playerId: 2, player: { name: "Bob" } },
        { id: 102, playerId: 3, player: { name: "Cara" } },
      ]);

      h.tx.groupStanding.update.mockResolvedValue({});

      await recalculateStandings(5, 1);

      // Should have 3 update calls (one per player)
      expect(h.tx.groupStanding.update).toHaveBeenCalledTimes(3);

      const calls = h.tx.groupStanding.update.mock.calls.map(
        (c: any) => c[0],
      );

      // Player 1 (Alice): 2 games, 2 wins, 0 losses, diff +10, 4 points, rank 1
      const alice = calls.find((c: any) => c.where.id === 100);
      expect(alice.data).toEqual({
        games: 2,
        wins: 2,
        losses: 0,
        diff: 10,
        points: 4,
        rank: 1,
      });

      // Player 2 (Bob): 1 game, 0 wins, 1 loss, diff -4, 0 points
      const bob = calls.find((c: any) => c.where.id === 101);
      expect(bob.data).toEqual({
        games: 1,
        wins: 0,
        losses: 1,
        diff: -4,
        points: 0,
        rank: expect.any(Number),
      });

      // Player 3 (Cara): 1 game, 0 wins, 1 loss, diff -6, 0 points
      const cara = calls.find((c: any) => c.where.id === 102);
      expect(cara.data).toEqual({
        games: 1,
        wins: 0,
        losses: 1,
        diff: -6,
        points: 0,
        rank: expect.any(Number),
      });

      // Bob should rank higher than Cara (same points, better diff)
      expect(bob.data.rank).toBeLessThan(cara.data.rank);
    });

    it("resets stats to zero for players with no played matches", async () => {
      const { recalculateStandings } = await import("@/prisma/db/match");

      // No played matches
      h.tx.match.findMany.mockResolvedValueOnce([]);

      h.tx.groupStanding.findMany.mockResolvedValueOnce([
        { id: 100, playerId: 1, player: { name: "Alice" } },
        { id: 101, playerId: 2, player: { name: "Bob" } },
      ]);

      h.tx.groupStanding.update.mockResolvedValue({});

      await recalculateStandings(5, 1);

      const calls = h.tx.groupStanding.update.mock.calls.map(
        (c: any) => c[0],
      );
      for (const call of calls) {
        expect(call.data.games).toBe(0);
        expect(call.data.wins).toBe(0);
        expect(call.data.losses).toBe(0);
        expect(call.data.diff).toBe(0);
        expect(call.data.points).toBe(0);
      }
    });
  });

  describe("getMatchesByTournamentId", () => {
    it("calls findMany with correct query and ordering", async () => {
      // For this test we need the root-level prisma mock to have match.findMany
      const matchFindMany = vi.fn().mockResolvedValueOnce([]);
      vi.doMock("@/lib/prisma", () => ({
        default: {
          ...h.prisma,
          match: { findMany: matchFindMany },
        },
      }));

      const { getMatchesByTournamentId } = await import(
        "@/prisma/db/match"
      );

      await getMatchesByTournamentId(42);

      expect(matchFindMany).toHaveBeenCalledWith({
        where: { tournamentId: 42 },
        include: {
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
        orderBy: [{ groupNumber: "asc" }, { id: "asc" }],
      });
    });
  });
});
