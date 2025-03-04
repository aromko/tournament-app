"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const rawFormData: SetupProps = {
    name: formData.get("name")!.toString(),
    players: parseInt(formData.get("players") as string),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    eliminationType: formData.get("eliminationType")?.toString(),
    numberOfGroups: parseInt(formData.get("numberOfGroups") as string),
  };

  const validation = tournamentSchema.safeParse({
    name: rawFormData.name,
    players: rawFormData.players,
    eliminationType: rawFormData.eliminationType,
    numberOfGroups: rawFormData.numberOfGroups,
  });

  let tournamentId = null;

  if (validation.success) {
    try {
      const tournament = await prisma!.tournament.create({
        data: {
          name: rawFormData.name,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          eliminationType: rawFormData.eliminationType,
          numberOfGroups: rawFormData.numberOfGroups,
        },
      });
      tournamentId = tournament.id;
    } catch (e) {
      return {
        message: `Failed to create tournament: ${e}`,
      };
    }

    redirect(`/setup/player/${tournamentId}?p=${rawFormData.players}`);
  } else {
    return {
      errors: validation.error.flatten().fieldErrors,
    };
  }
}

export async function createTournamentPlayers(
  currentState: { tournamentId: string },
  formData: FormData,
) {
  const playerData = Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => key.startsWith("player_")),
  );

  console.log(playerData);

  try {
    for (const name of Object.values(playerData)) {
      await prisma!.player.create({
        data: {
          name: name as string,
          tournamentId: parseInt(currentState.tournamentId),
        },
      });
    }
  } catch (e) {
    return {
      message: `Failed to create player: ${e}`,
    };
  }
}
