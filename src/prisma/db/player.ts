import prisma from "@/lib/prisma";

export async function createPlayer(name: File | string, tournamentId: string) {
  await prisma!.player.create({
    data: {
      name: name as string,
      tournamentId: parseInt(tournamentId),
    },
  });
}

export async function countPlayersByTournamentId(tournamentId: number) {
  return prisma!.player.count({ where: { tournamentId } });
}
