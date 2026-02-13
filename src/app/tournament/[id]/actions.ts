"use server";

import prisma from "@/lib/prisma";
import { recalculateStandings } from "@/prisma/db/match";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const matchScoreSchema = z
  .object({
    matchId: z.number().int().positive(),
    score1: z.number().int().min(0),
    score2: z.number().int().min(0),
  })
  .refine((d) => d.score1 !== d.score2, {
    message: "Draws are not allowed",
  });

export async function saveMatchScore(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const raw = {
    matchId: Number(formData.get("matchId")),
    score1: Number(formData.get("score1")),
    score2: Number(formData.get("score2")),
  };

  const validation = matchScoreSchema.safeParse(raw);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Invalid input" };
  }

  const { matchId, score1, score2 } = validation.data;

  const match = await (prisma as any).match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, groupNumber: true },
  });

  if (!match) {
    return { error: "Match not found" };
  }

  await (prisma as any).match.update({
    where: { id: matchId },
    data: { score1, score2, played: true },
  });

  await recalculateStandings(match.tournamentId, match.groupNumber);
  revalidatePath(`/tournament/${match.tournamentId}`);

  return {};
}
