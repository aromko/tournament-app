import prisma from "../../lib/prisma";

export async function getTournaments() {
  return prisma!.tournament.findMany();
}
