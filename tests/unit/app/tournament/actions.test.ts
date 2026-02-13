import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  prisma: {
    match: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  recalculateStandings: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: h.prisma,
}));

vi.mock("@/prisma/db/match", () => ({
  recalculateStandings: h.recalculateStandings,
}));

vi.mock("next/cache", () => ({
  revalidatePath: h.revalidatePath,
}));

describe("saveMatchScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns error when scores are equal (no draws)", async () => {
    const { saveMatchScore } = await import(
      "@/app/tournament/[id]/actions"
    );

    const fd = new FormData();
    fd.set("matchId", "1");
    fd.set("score1", "3");
    fd.set("score2", "3");

    const res = await saveMatchScore(null, fd);

    expect(res.error).toBe("Draws are not allowed");
    expect(h.prisma.match.findUnique).not.toHaveBeenCalled();
  });

  it("returns error for negative scores", async () => {
    const { saveMatchScore } = await import(
      "@/app/tournament/[id]/actions"
    );

    const fd = new FormData();
    fd.set("matchId", "1");
    fd.set("score1", "-1");
    fd.set("score2", "3");

    const res = await saveMatchScore(null, fd);

    expect(res.error).toBeTruthy();
    expect(h.prisma.match.findUnique).not.toHaveBeenCalled();
  });

  it("returns error for non-numeric matchId", async () => {
    const { saveMatchScore } = await import(
      "@/app/tournament/[id]/actions"
    );

    const fd = new FormData();
    fd.set("matchId", "abc");
    fd.set("score1", "3");
    fd.set("score2", "1");

    const res = await saveMatchScore(null, fd);

    expect(res.error).toBeTruthy();
  });

  it("returns error when match is not found", async () => {
    const { saveMatchScore } = await import(
      "@/app/tournament/[id]/actions"
    );

    h.prisma.match.findUnique.mockResolvedValueOnce(null);

    const fd = new FormData();
    fd.set("matchId", "999");
    fd.set("score1", "3");
    fd.set("score2", "1");

    const res = await saveMatchScore(null, fd);

    expect(res.error).toBe("Match not found");
    expect(h.prisma.match.update).not.toHaveBeenCalled();
  });

  it("updates match, recalculates standings, and revalidates path on success", async () => {
    const { saveMatchScore } = await import(
      "@/app/tournament/[id]/actions"
    );

    h.prisma.match.findUnique.mockResolvedValueOnce({
      tournamentId: 5,
      groupNumber: 2,
    });
    h.prisma.match.update.mockResolvedValueOnce({});
    h.recalculateStandings.mockResolvedValueOnce(undefined);

    const fd = new FormData();
    fd.set("matchId", "10");
    fd.set("score1", "11");
    fd.set("score2", "7");

    const res = await saveMatchScore(null, fd);

    expect(res).toEqual({});
    expect(h.prisma.match.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { score1: 11, score2: 7, played: true },
    });
    expect(h.recalculateStandings).toHaveBeenCalledWith(5, 2);
    expect(h.revalidatePath).toHaveBeenCalledWith("/tournament/5");
  });
});
