"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const raw = {
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    players: formData.get("players"),
    eliminationType: formData.get("eliminationType"),
    numberOfGroups: formData.get("numberOfGroups"),
  };

  const validation = tournamentSchema.safeParse({
    name: typeof raw.name === "string" ? raw.name : "",
    players:
      typeof raw.players === "string" ? parseInt(raw.players, 10) : Number.NaN,
    eliminationType:
      typeof raw.eliminationType === "string" ? raw.eliminationType : "SINGLE",
    numberOfGroups:
      typeof raw.numberOfGroups === "string"
        ? parseInt(raw.numberOfGroups, 10)
        : 2,
  });

  let tournamentId: number | null = null;

  if (validation.success) {
    const { name, players, eliminationType, numberOfGroups } = validation.data;
    const rawId = typeof raw.tournamentId === "string" ? parseInt(raw.tournamentId, 10) : NaN;
    const isEditing = Number.isFinite(rawId);
    try {
      if (isEditing) {
        const updated = await prisma.tournament.update({
          where: { id: rawId },
          data: {
            name,
            eliminationType,
            numberOfGroups,
          },
        });
        tournamentId = updated.id;
      } else {
        const created = await prisma.tournament.create({
          data: {
            name,
            eliminationType,
            numberOfGroups,
          },
        });
        tournamentId = created.id;
      }
    } catch (e) {
      return {
        message: `Failed to ${isEditing ? "update" : "create"} tournament: ${e}`,
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
  const playerEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith("player_"));

  if (!currentState.tournamentId) {
    return {
      message: "Invalid tournament ID",
    };
  }

  const tournamentId = parseInt(currentState.tournamentId, 10);
  if (!Number.isFinite(tournamentId)) {
    return { message: "Invalid tournament ID" };
  }

  // Build ordered list of submitted names based on index suffix
  const submittedNames: string[] = playerEntries
    .map(([key, value]) => {
      const m = /^player_(\d+)$/.exec(key);
      const idx = m ? parseInt(m[1], 10) : Number.NaN;
      const name = typeof value === "string" ? value.trim() : "";
      return { idx, name };
    })
    .filter((x) => Number.isFinite(x.idx))
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.name);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.player.findMany({
        where: { tournamentId },
        orderBy: { id: "asc" },
      });

      // Update or create to match submitted names
      for (let i = 0; i < submittedNames.length; i++) {
        const name = submittedNames[i];
        if (!name) continue; // inputs are required, but guard anyway
        const current = existing[i];
        if (current) {
          if (current.name !== name) {
            await tx.player.update({ where: { id: current.id }, data: { name } });
          }
        } else {
          await tx.player.create({ data: { name, tournamentId } });
        }
      }

      // If fewer names submitted than existing players, remove the extras
      if (existing.length > submittedNames.length) {
        const toDelete = existing.slice(submittedNames.length).map((p) => p.id);
        if (toDelete.length > 0) {
          await tx.player.deleteMany({ where: { id: { in: toDelete }, tournamentId } });
        }
      }
    });
  } catch (e) {
    return {
      message: `Failed to save players: ${e}`,
    };
  }

  redirect(`/setup/teams/${currentState.tournamentId}`);
}


export async function assignTournamentTeams(
  currentState: { tournamentId?: string },
  formData: FormData,
) {
  const tournamentIdStr = currentState.tournamentId;
  if (!tournamentIdStr) {
    return { message: "Invalid tournament ID" };
  }
  const tournamentId = parseInt(tournamentIdStr, 10);
  if (!Number.isFinite(tournamentId)) {
    return { message: "Invalid tournament ID" };
  }

  const removedIds: number[] = [];
  const assignments: { id: number; groupNumber: number }[] = [];

  let numberOfGroups: number | null = null;
  const rawNumberOfGroups = formData.get("numberOfGroups");
  if (typeof rawNumberOfGroups === "string") {
    const n = parseInt(rawNumberOfGroups, 10);
    if (Number.isFinite(n)) numberOfGroups = n;
  }

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("removed_")) {
      const idStr = key.slice("removed_".length);
      const idNum = parseInt(idStr, 10);
      if (Number.isFinite(idNum)) removedIds.push(idNum);
    }
    if (key.startsWith("player_")) {
      const idStr = key.slice("player_".length);
      const idNum = parseInt(idStr, 10);
      const groupNum = typeof value === "string" ? parseInt(value, 10) : NaN;
      if (Number.isFinite(idNum) && Number.isFinite(groupNum)) {
        assignments.push({ id: idNum, groupNumber: groupNum });
      }
    }
  }

  if (numberOfGroups == null && assignments.length > 0) {
    numberOfGroups = Math.max(...assignments.map((a) => a.groupNumber));
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (removedIds.length > 0) {
        await tx.player.deleteMany({
          where: { id: { in: removedIds }, tournamentId },
        });
      }

      if (assignments.length > 0) {
        for (const a of assignments) {
          await tx.player.updateMany({
            where: { id: a.id, tournamentId },
            data: { groupNumber: a.groupNumber },
          });
        }
      }

      // Mark tournament as started and optionally persist number of groups
      if (numberOfGroups != null && Number.isFinite(numberOfGroups)) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { numberOfGroups, started: true },
        });
      } else {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { started: true },
        });
      }
    });
  } catch (e) {
    return { message: `Failed to assign teams: ${e}` };
  }

  redirect("/");
}
