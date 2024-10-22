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

  try {
    await prisma!.tournament.create({
      data: {
        name: rawFormData.name,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        eliminationType: rawFormData.eliminationType,
        numberOfGroups: rawFormData.numberOfGroups,
      },
    });
  } catch (e) {
    return {
      message: `Failed to create tournament: ${e}`,
    };
  }

  redirect(`/setup/player?players=${rawFormData.players}`);
}
