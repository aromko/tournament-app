"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

interface SetupProps {
  name: string;
  players: number;
  eliminationType: string;
  numberOfGroups: number;
}

export async function createTournament(
  currentState: unknown,
  formData: FormData,
) {
  const rawFormData: SetupProps = {
    name: formData.get("name")!.toString(),
    players: parseInt(formData.get("players") as string),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    eliminationType: formData.get("elimination-type")?.toString(),
    numberOfGroups: parseInt(formData.get("group-number") as string),
  };

  let tournamentId = null;
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
