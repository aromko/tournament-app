import prisma from "@/lib/prisma";

export async function createPlayer(name: string, tournamentId: number) {
  return prisma.player.create({
    data: {
      name,
      tournamentId,
    },
  });
}

export async function countPlayersByTournamentId(tournamentId: number) {
  return prisma.player.count({ where: { tournamentId } });
}

export async function getPlayersByTournamentId(tournamentId: number) {
  return prisma.player.findMany({ where: { tournamentId } });
}
