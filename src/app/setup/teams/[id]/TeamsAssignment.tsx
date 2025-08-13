"use client";
import { Button } from "@/components/ui/button";
import { DndContext } from "@dnd-kit/core";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DraggablePlayer } from "@/components/DraggablePlayer";
import { DroppableColumn } from "@/components/DroppableColumn";
import { type ContainersState, useHandleDragEnd } from "@/hooks/useHandleDragEnd";
import { buildGroupIds, buildInitialState, parseGroupCount } from "@/lib/utils";

export type Player = { id: string; name: string };
export const UNASSIGNED_ID = "unassigned" as const;

export default function TeamsAssignment({ players }: { players: Player[] }) {
  const searchParams = useSearchParams();

  const groupCount = useMemo(
    () => parseGroupCount(searchParams),
    [searchParams],
  );

  const initialState = useMemo<ContainersState>(
    () => buildInitialState(players, groupCount, UNASSIGNED_ID),
    [players, groupCount],
  );

  const [containers, setContainers] = useState<ContainersState>(initialState);
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
              <DraggablePlayer key={pid} player={playerById[pid]} />
            ))}
          </DroppableColumn>
        </div>
        {/* Right: Groups grid */}
        <form id="teamForm" className="col-span-8 lg:col-span-5 space-y-6">
          <div className="grid gap-4" style={gridTemplateStyle}>
            {groupIds.map((gid, idx) => (
              <DroppableColumn key={gid} id={gid} title={`Group ${idx + 1}`}>
                {containers[gid].map((pid) => (
                  <DraggablePlayer key={pid} player={playerById[pid]} />
                ))}
              </DroppableColumn>
            ))}
          </div>
        </form>
      </DndContext>
      {/* Actions */}
      <Button
        type="button"
        className="w-full col-end-9 col-span-2"
        aria-disabled={false}
        variant="secondary"
        onClick={() => {}}
      >
        Add Team
      </Button>
      <Button
        type="submit"
        className="w-full col-span-full"
        aria-disabled={false}
        form="teamForm"
      >
        Continue
      </Button>
    </div>
  );
}
