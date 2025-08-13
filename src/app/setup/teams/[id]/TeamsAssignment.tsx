"use client";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export type Player = { id: string; name: string };
type ContainerId = string; // e.g. "unassigned", "group-1", ...
type ContainersState = Record<ContainerId, string[]>; // containerId -> array of playerIds
type DraggablePlayerProps = { player: Player };
type DroppableColumnProps = {
  id: ContainerId;
  title: string;
  children?: React.ReactNode;
};

const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  });
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="select-none cursor-grab active:cursor-grabbing px-3 py-2 rounded-md border bg-background shadow-sm text-sm"
      style={style}
    >
      {player.name}
    </div>
  );
};

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  title,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
      <div
        ref={setNodeRef}
        className={`min-h-36 rounded-lg border p-3 transition-colors ${isOver ? "ring-2 ring-primary/50 bg-accent/30" : ""}`}
      >
        <div className="flex flex-col gap-2">{children}</div>
        {React.Children.count(children) === 0 ? (
          <div className="text-sm text-muted-foreground">Drop here</div>
        ) : null}
      </div>
    </div>
  );
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TeamsAssignment({ players }: { players: Player[] }) {
  const UNASSIGNED_ID = "unassigned" as const;

  const searchParams = useSearchParams();

  // Extract: encapsulate parsing and clamping of group count
  const groupCount = useMemo(
    () => parseGroupCount(searchParams),
    [searchParams],
  );

  // Extract: initial state builder
  const initialState = useMemo<ContainersState>(
    () => buildInitialState(players, groupCount, UNASSIGNED_ID),
    [players, groupCount],
  );

  const [containers, setContainers] = useState<ContainersState>(initialState);

  // Derived maps and ids
  const playerById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );
  const groupIds = useMemo(() => buildGroupIds(groupCount), [groupCount]);

  // Presentation details extracted for clarity
  const gridColumnCount = useMemo(() => Math.min(groupCount, 4), [groupCount]);
  const gridTemplateStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))`,
    }),
    [gridColumnCount],
  );

  function getContainerIdByPlayer(playerId: string): ContainerId | null {
    for (const [cid, list] of Object.entries(containers)) {
      if (list.includes(playerId)) return cid;
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const playerId = String(active.id);
    const to = String(over.id) as ContainerId;

    // Validate destination container
    if (!(to in containers)) return;

    const from = getContainerIdByPlayer(playerId);
    if (!from || from === to) return;

    setContainers((prev) => movePlayer(prev, from, to, playerId));
  }

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

  // Helper functions (extracted)

  function parseGroupCount(params: ReturnType<typeof useSearchParams>) {
    const raw = params.get("groups") ?? params.get("g") ?? "4";
    const n = Number.parseInt(raw, 10);

    return clamp(Number.isFinite(n) ? n : 4, 1, 16);
  }

  function buildInitialState(
    list: Player[],
    count: number,
    unassignedId: typeof UNASSIGNED_ID,
  ): ContainersState {
    const base: ContainersState = { [unassignedId]: list.map((p) => p.id) };
    for (let i = 1; i <= count; i++) base[`group-${i}`] = [];

    return base;
  }

  function buildGroupIds(count: number) {
    return Array.from({ length: count }, (_, i) => `group-${i + 1}` as const);
  }

  function movePlayer(
    prev: ContainersState,
    from: ContainerId,
    to: ContainerId,
    playerId: string,
  ): ContainersState {
    if (!prev[from] || !prev[to]) return prev;
    if (from === to) return prev;

    const next: ContainersState = { ...prev };
    next[from] = next[from].filter((id) => id !== playerId);
    if (!next[to].includes(playerId)) next[to] = [...next[to], playerId];
    return next;
  }
}
