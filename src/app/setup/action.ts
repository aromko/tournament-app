"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

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
    await prisma.$transaction(async (tx: TransactionClient) => {
      const existing = await tx.player.findMany({
        where: { tournamentId },
        orderBy: { id: "asc" },
      });

      // Update or create to match submitted names (batch operations in parallel)
      const updateOps: Promise<unknown>[] = [];
      const createOps: { name: string; tournamentId: number }[] = [];

      for (let i = 0; i < submittedNames.length; i++) {
        const name = submittedNames[i];
        if (!name) continue; // inputs are required, but guard anyway
        const current = existing[i];
        if (current) {
          if (current.name !== name) {
            updateOps.push(tx.player.update({ where: { id: current.id }, data: { name } }));
          }
        } else {
          createOps.push({ name, tournamentId });
        }
      }

      await Promise.all(updateOps);
      if (createOps.length > 0) {
        await tx.player.createMany({ data: createOps });
      }

      // If fewer names submitted than existing players, remove the extras
      if (existing.length > submittedNames.length) {
        const toDelete = existing.slice(submittedNames.length).map((p: { id: number }) => p.id);
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

  // If the submit button "Open registration" was clicked, it will include this field
  const openRegistration = formData.get("openRegistration") != null;

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
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Clear assignments for explicitly removed players (do NOT delete players)
      if (removedIds.length > 0) {
        await tx.player.updateMany({
          where: { id: { in: removedIds }, tournamentId },
          data: { groupNumber: null },
        });
      }

      if (!openRegistration) {
        // Guard: cannot start if there are no players left or no assignments submitted
        if (typeof (tx as any)?.player?.count === "function") {
          const remainingPlayers = await (tx as any).player.count({ where: { tournamentId } });
          if (remainingPlayers === 0) {
            throw new Error("Cannot start: no players in the tournament.");
          }
        }
        if (assignments.length === 0) {
          throw new Error("Cannot start: assign at least one player to a group.");
        }
      }

      // First, clear groupNumber for all players that are not part of the submitted assignments
      const assignedIds = assignments.map((a) => a.id);
      await tx.player.updateMany({
        where: assignedIds.length
          ? { tournamentId, id: { notIn: assignedIds } }
          : { tournamentId },
        data: { groupNumber: null },
      });

      // Then, apply the submitted assignments (batch in parallel)
      if (assignments.length > 0) {
        await Promise.all(
          assignments.map((a) =>
            tx.player.updateMany({
              where: { id: a.id, tournamentId },
              data: { groupNumber: a.groupNumber },
            })
          )
        );
      }

      // Update tournament: on open registration keep started=false, otherwise set started=true; always persist numberOfGroups if provided
      if (numberOfGroups != null && Number.isFinite(numberOfGroups)) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: openRegistration ? { numberOfGroups } : { numberOfGroups, started: true },
        });
      } else if (!openRegistration) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { started: true },
        });
      }
    });
  } catch (e) {
    return { message: `Failed to assign teams: ${e instanceof Error ? e.message : e}` };
  }

  redirect("/");
}


// Extracted core logic so it can be reused from an API route or other server code
export async function performStartTournament(tournamentId: number): Promise<void> {
  await prisma.$transaction(async (tx: TransactionClient) => {
    // Load tournament and players
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, numberOfGroups: true, started: true },
    });
    if (!tournament) throw new Error("Tournament not found");

    // Determine valid number of groups
    let numberOfGroups = tournament.numberOfGroups ?? 2;
    if (!Number.isFinite(numberOfGroups) || numberOfGroups < 1) numberOfGroups = 2;

    const players = await tx.player.findMany({
      where: { tournamentId },
      select: { id: true, groupNumber: true },
      orderBy: { id: "asc" },
    });

    if (players.length === 0) {
      throw new Error("Cannot start: no players in the tournament.");
    }

    // Build current counts and list of unassigned players
    const counts = Array.from({ length: numberOfGroups }, () => 0);
    const unassigned: number[] = [];
    for (const p of players) {
      if (p.groupNumber == null) {
        unassigned.push(p.id);
      } else if (
        Number.isFinite(p.groupNumber) &&
        p.groupNumber! >= 1 &&
        p.groupNumber! <= numberOfGroups
      ) {
        counts[p.groupNumber! - 1]++;
      } else {
        // Out-of-range assignments are treated as unassigned
        unassigned.push(p.id);
      }
    }

    // Helper to find the index of the group with the minimal count
    const pickGroup = () => {
      let minIdx = 0;
      for (let i = 1; i < counts.length; i++) {
        if (counts[i] < counts[minIdx]) minIdx = i;
      }
      counts[minIdx]++;
      return minIdx + 1; // group numbers are 1-based
    };

    // Assign all unassigned players to balance groups (prepare assignments, then batch)
    const playerAssignments = unassigned.map((playerId) => ({
      playerId,
      groupNumber: pickGroup(),
    }));

    await Promise.all(
      playerAssignments.map(({ playerId, groupNumber }) =>
        tx.player.update({
          where: { id: playerId },
          data: { groupNumber },
        })
      )
    );

    // Finally, mark tournament as started
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { started: true, numberOfGroups },
    });
  });
}

export async function deleteTournamentPlayer(formData: FormData): Promise<void> {
  const rawTid = formData.get("tournamentId");
  const rawPid = formData.get("playerId");
  const tournamentId = typeof rawTid === "string" ? parseInt(rawTid, 10) : NaN;
  const playerId = typeof rawPid === "string" ? parseInt(rawPid, 10) : NaN;

  if (!Number.isFinite(tournamentId) || !Number.isFinite(playerId)) {
    throw new Error("Invalid tournament or player ID");
  }

  try {
    await prisma.player.deleteMany({ where: { id: playerId, tournamentId } });
  } catch (e) {
    throw new Error(`Failed to delete player: ${e instanceof Error ? e.message : e}`);
  }

  redirect(`/setup/teams/${tournamentId}`);
}
