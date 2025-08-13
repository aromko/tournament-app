"use client";
import { Button } from "@/components/ui/button";
import { DndContext } from "@dnd-kit/core";
import React, { useActionState, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { DroppableColumn } from "@/components/DroppableColumn";
import { type ContainersState, useHandleDragEnd } from "@/hooks/useHandleDragEnd";
import { buildGroupIds, buildInitialState, parseGroupCount } from "@/lib/utils";
import { assignTournamentTeams } from "@/app/setup/action";

export type Player = { id: string; name: string };
export const UNASSIGNED_ID = "unassigned" as const;

export default function TeamsAssignment({ players }: { players: Player[] }) {
  const searchParams = useSearchParams();
  const params = useParams();
  const tournamentId = String(params.id ?? "");

  const groupCount = useMemo(
    () => parseGroupCount(searchParams),
    [searchParams],
  );

  const initialState = useMemo<ContainersState>(
    () => buildInitialState(players, groupCount, UNASSIGNED_ID),
    [players, groupCount],
  );

  const [containers, setContainers] = useState<ContainersState>(initialState);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const handleDragEnd = useHandleDragEnd(containers, setContainers);

  const playerById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );
  const groupIds = useMemo(() => buildGroupIds(groupCount), [groupCount]);

  const gridColumnCount = useMemo(() => Math.min(groupCount, 4), [groupCount]);
  const gridTemplateStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))`,
    }),
    [gridColumnCount],
  );

  const [actionError, formAction, isPending] = useActionState(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error Server Action
    assignTournamentTeams,
    { tournamentId },
  );

  const unassignedCount = containers[UNASSIGNED_ID]?.length ?? 0;
  const canContinue = unassignedCount === 0;

  const handleRemove = (pid: string) => {
    setContainers((prev) => {
      const next: ContainersState = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((id) => id !== pid);
      }
      return next;
    });
    setRemoved((prev) => {
      const next = new Set(prev);
      next.add(pid);
      return next;
    });
  };

  return (
    <div className="mx-6 md:mx-16 lg:mx-32 xl:mx-60 2xl:mx-80 grid gap-6 grid-cols-8 items-start">
      <h1 className="col-span-full text-2xl font-semibold">
        Assign players to groups
      </h1>
      <DndContext onDragEnd={handleDragEnd}>
        {/* Left: Unassigned players */}
        <div className="col-span-8 lg:col-span-3 space-y-4">
          <DroppableColumn id={UNASSIGNED_ID} title="Players">
            {containers[UNASSIGNED_ID].map((pid) => (
              <DraggablePlayer key={pid} player={playerById[pid]} onRemove={() => handleRemove(pid)} />
            ))}
          </DroppableColumn>
        </div>
        {/* Right: Groups grid */}
        <form id="teamForm" action={formAction} className="col-span-8 lg:col-span-5 space-y-6">
          <div className="grid gap-4" style={gridTemplateStyle}>
            {groupIds.map((gid, idx) => (
              <DroppableColumn key={gid} id={gid} title={`Group ${idx + 1}`}>
                {containers[gid].map((pid) => (
                  <React.Fragment key={pid}>
                    <input type="hidden" name={`player_${pid}`} value={`${idx + 1}`} />
                    <DraggablePlayer player={playerById[pid]} onRemove={() => handleRemove(pid)} />
                  </React.Fragment>
                ))}
              </DroppableColumn>
            ))}
          </div>
          {/* Removed players markers */}
          {Array.from(removed).map((pid) => (
            <input key={`removed-${pid}`} type="hidden" name={`removed_${pid}`} value="1" />
          ))}
        </form>
      </DndContext>
      {/* Actions */}
      <Button
        type="button"
        className="w-full col-end-9 col-span-2"
        aria-disabled={isPending}
        variant="secondary"
        onClick={() => {}}
      >
        Add Team
      </Button>
      <Button
        type="submit"
        className="w-full col-span-full"
        aria-disabled={isPending || !canContinue}
        disabled={isPending || !canContinue}
        form="teamForm"
      >
        Continue
      </Button>
      {actionError?.message ? (
        <div className="col-span-full text-red-600 text-sm">{actionError.message}</div>
      ) : null}
    </div>
  );
}
