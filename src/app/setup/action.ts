"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { countPlayersByTournamentId, createPlayer } from "@/prisma/db";

interface SetupProps {
  name: string;
  players: number;
  eliminationType: string;
  numberOfGroups: number;
}

const tournamentSchema = z.object({
  name: z.string().min(2, "Tournament name must be at least 2 characters"),
  players: z.number().min(4).max(32),
  eliminationType: z.enum(["SINGLE", "MULTI"]),
  numberOfGroups: z.number(),
});

export async function createTournament(
  currentState: unknown,
  formData: FormData,
) {
  const { name, players, eliminationType, numberOfGroups }: SetupProps = {
    name: formData.get("name")!.toString(),
    players: parseInt(formData.get("players") as string),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    eliminationType: formData.get("eliminationType")?.toString(),
    numberOfGroups: parseInt(formData.get("numberOfGroups") as string),
  };

  const validation = tournamentSchema.safeParse({
    name,
    players,
    eliminationType,
    numberOfGroups,
  });

  let tournamentId = null;

  if (validation.success) {
    try {
      const tournament = await prisma!.tournament.create({
        data: {
          name,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          eliminationType,
          numberOfGroups,
        },
      });
      tournamentId = tournament.id;
    } catch (e) {
      return {
        message: `Failed to create tournament: ${e}`,
      };
    }

    redirect(`/setup/player/${tournamentId}?p=${players}`);
  } else {
    return {
      errors: validation.error.flatten().fieldErrors,
    };
  }
}

export async function createTournamentPlayers(
  currentState: { tournamentId?: string },
  formData: FormData,
) {
  const playerData = Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => key.startsWith("player_")),
  );

  if (!currentState.tournamentId) {
    return {
      message: "Invalid tournament ID",
    };
  }

  try {
    const playersCount = await countPlayersByTournamentId(
      parseInt(currentState.tournamentId),
    );

    if (playersCount === 0) {
      for (const name of Object.values(playerData)) {
        await createPlayer(name, currentState.tournamentId);
      }
    }
  } catch (e) {
    return {
      message: `Failed to create player: ${e}`,
    };
  }

  redirect(`/setup/teams`);
}
