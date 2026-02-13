"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DndContext } from "@dnd-kit/core";
import React, { useActionState, useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { DroppableColumn } from "@/components/DroppableColumn";
import {
  type ContainersState,
  useHandleDragEnd,
} from "@/hooks/useHandleDragEnd";
import { buildGroupIds, buildInitialState, parseGroupCount } from "@/lib/utils";
import {
  assignTournamentTeams,
  deleteTournamentPlayer,
} from "@/app/setup/action";
import { EllipsisVertical } from "lucide-react";
import Link from "next/link";

export type Player = { id: string; name: string; groupNumber?: number | null };
export const UNASSIGNED_ID = "unassigned" as const;

export default function TeamsAssignment({
  players,
  tournamentId: tournamentIdProp,
  initialGroupCount,
}: {
  players: Player[];
  tournamentId?: string;
  initialGroupCount?: number;
}) {
  const searchParams = useSearchParams();
  const params = useParams();
  const tournamentId = tournamentIdProp ?? String((params as any)?.id ?? "");

  const groupCount = useMemo(
    () =>
      typeof initialGroupCount === "number"
        ? initialGroupCount
        : parseGroupCount(searchParams),
    [initialGroupCount, searchParams],
  );

  const [groupCountState, setGroupCountState] = useState<number>(groupCount);

  const initialState = useMemo<ContainersState>(
    () => buildInitialState(players, groupCountState, UNASSIGNED_ID),
    [players, groupCountState],
  );

  const [containers, setContainers] = useState<ContainersState>(initialState);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const handleDragEnd = useHandleDragEnd(containers, setContainers);

  const playerById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );
  const groupIds = useMemo(
    () => buildGroupIds(groupCountState),
    [groupCountState],
  );

  const gridColumnCount = useMemo(
    () => Math.min(groupCountState, 2),
    [groupCountState],
  );
  const gridTemplateStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))`,
    }),
    [gridColumnCount],
  );

  const [actionError, formAction, isPending] = useActionState(
    // @ts-expect-error Server Action
    assignTournamentTeams,
    { tournamentId },
  );

  const unassignedCount = containers[UNASSIGNED_ID]?.length ?? 0;
  const hasPlayers = players.length > 0;
  const canContinue = hasPlayers && unassignedCount === 0;

  const handleRemove = useCallback((pid: string) => {
    setContainers((prev) => {
      const next: ContainersState = { ...prev };
      // Remove from all containers first
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((id) => id !== pid);
      }
      // Add back to the unassigned "Players" column
      next[UNASSIGNED_ID] = [...(next[UNASSIGNED_ID] ?? []), pid];
      return next;
    });
    // Mark as removed so the server can clear any existing assignment
    setRemoved((prev) => {
      const next = new Set(prev);
      next.add(pid);
      return next;
    });
  }, []);

  const handleAddGroup = useCallback(() => {
    setGroupCountState((prev) => {
      const next = Math.min(prev + 1, 16);
      setContainers((prevC) => {
        const key = `group-${next}` as const;
        if (prevC[key]) return prevC;
        return { ...prevC, [key]: [] } as ContainersState;
      });
      return next;
    });
  }, []);

  const handleRemoveGroup = useCallback(() => {
    // Find the highest existing group index
    setContainers((prev) => {
      let max = 0;
      for (const k of Object.keys(prev)) {
        const m = /^group-(\d+)$/.exec(k);
        if (m) max = Math.max(max, Number(m[1]));
      }
      if (max <= 0) return prev; // no groups
      const key = `group-${max}` as const;
      const toMove = prev[key] ?? [];
      const rest: Record<string, string[]> = { ...prev };
      delete rest[key];
      const nextUnassigned = [...(prev[UNASSIGNED_ID] ?? []), ...toMove];
      const next: ContainersState = {
        ...(rest as ContainersState),
        [UNASSIGNED_ID]: nextUnassigned,
      } as ContainersState;
      return next;
    });
    setGroupCountState((prev) => Math.max(1, prev - 1));
  }, []);

  const handleShuffle = useCallback(() => {
    setContainers((prevContainers) => {
      // Gather all non-removed players currently in any container
      const all: string[] = [];
      for (const [cid, list] of Object.entries(prevContainers)) {
        if (cid === UNASSIGNED_ID || cid.startsWith("group-")) {
          all.push(...list);
        }
      }
      // Shuffle players
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }

      const next: ContainersState = { [UNASSIGNED_ID]: [] } as ContainersState;
      for (const gid of groupIds) next[gid] = [];
      all.forEach((pid, idx) => {
        const gid = groupIds[idx % groupIds.length];
        next[gid].push(pid);
      });

      return next;
    });
  }, [groupIds]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 grid-cols-8 items-start">
      <DndContext onDragEnd={handleDragEnd}>
        {/* Left: Unassigned players */}
        <div className="col-span-8 lg:col-span-3 space-y-4">
          <DroppableColumn id={UNASSIGNED_ID} title="Players">
            {containers[UNASSIGNED_ID].map((pid) => {
              const p = playerById[pid];
              if (!p) return null;
              return (
                <DraggablePlayer
                  key={pid}
                  player={p}
                  actionEl={
                    <form action={deleteTournamentPlayer}>
                      <input
                        type="hidden"
                        name="tournamentId"
                        value={tournamentId}
                      />
                      <input type="hidden" name="playerId" value={pid} />
                      <button
                        type="submit"
                        className="shrink-0 text-xs px-2 py-1 border rounded hover:bg-accent"
                        aria-label={`Delete ${p.name}`}
                      >
                        Delete
                      </button>
                    </form>
                  }
                />
              );
            })}
          </DroppableColumn>
        </div>
        {/* Right: Groups grid */}
        <form
          id="teamForm"
          action={formAction}
          className="col-span-8 lg:col-span-5 space-y-6"
        >
          <div className="grid gap-4" style={gridTemplateStyle}>
            {groupIds.map((gid, idx) => (
              <DroppableColumn key={gid} id={gid} title={`Group ${idx + 1}`}>
                {containers[gid].map((pid) => {
                  const p = playerById[pid];
                  if (!p) return null;
                  return (
                    <React.Fragment key={pid}>
                      <input
                        type="hidden"
                        name={`player_${pid}`}
                        value={`${idx + 1}`}
                      />
                      <DraggablePlayer
                        player={p}
                        onRemove={() => handleRemove(pid)}
                      />
                    </React.Fragment>
                  );
                })}
              </DroppableColumn>
            ))}
          </div>
          {/* Persist number of groups */}
          <input
            type="hidden"
            name="numberOfGroups"
            value={`${groupCountState}`}
          />
          {/* Removed players markers */}
          {Array.from(removed).map((pid) => (
            <input
              key={`removed-${pid}`}
              type="hidden"
              name={`removed_${pid}`}
              value="1"
            />
          ))}
        </form>
      </DndContext>
      {/* Actions row: Shuffle and Action menu on the same line */}
      <div className="col-span-full flex items-center gap-2">
        <Button
          type="button"
          className="w-auto"
          aria-disabled={isPending}
          variant="secondary"
          onClick={handleShuffle}
        >
          Shuffle
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className="w-auto"
              variant="ghost"
              aria-label="Actions"
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-28">
            <DropdownMenuItem
              onSelect={() => {
                handleAddGroup();
              }}
            >
              Add Group
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                handleRemoveGroup();
              }}
            >
              Remove Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full col-span-full grid grid-cols-1 md:grid-cols-5 gap-3">
        <Button
          asChild
          type="button"
          variant="outline"
          className="w-full col-end-4"
        >
          <Link href={`/setup/player/${tournamentId}?p=${players.length}`}>
            Cancel
          </Link>
        </Button>
        <div className="flex col-end-6 col-span-2 gap-2">
          <Button
            type="submit"
            name="openRegistration"
            value="1"
            className="w-full"
            aria-disabled={isPending}
            disabled={isPending}
            form="teamForm"
          >
            Open registration
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="w-fit"
                variant="ghost"
                aria-label="More actions"
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-28">
              <DropdownMenuItem asChild disabled={isPending || !canContinue}>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById(
                      "teamForm",
                    ) as HTMLFormElement | null;
                    form?.requestSubmit();
                  }}
                  aria-disabled={isPending || !canContinue}
                  disabled={isPending || !canContinue}
                >
                  Start tournament
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {actionError?.message ? (
        <div className="col-span-full text-red-600 text-sm">
          {actionError.message}
        </div>
      ) : null}
    </div>
  );
}
