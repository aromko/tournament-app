"use client";
import { Button } from "@/components/ui/button";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// Simple types
type Player = { id: string; name: string };

type ContainerId = string; // e.g. "unassigned", "group-1", ...

type ContainersState = Record<ContainerId, string[]>; // containerId -> array of playerIds

type DraggablePlayerProps = { player: Player };
const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: player.id });
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

type DroppableColumnProps = {
  id: ContainerId;
  title: string;
  children?: React.ReactNode;
};
const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, children }) => {
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

function parsePlayersParam(param: string | null): Player[] {
  const fallback = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"];
  const raw = (param ?? fallback.join(","))
    .split(/[\n,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length === 0) return fallback.map((name, i) => ({ id: `${name}-${i}`.toLowerCase(), name }));
  return raw.map((name, i) => ({ id: `${name}-${i}`.toLowerCase(), name }));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function TeamsContent() {
  const searchParams = useSearchParams();
  const players = useMemo(() => parsePlayersParam(searchParams.get("players")), [searchParams]);
  const groupsCount = useMemo(() => {
    const raw = searchParams.get("groups") ?? searchParams.get("g") ?? "4";
    const n = Number.parseInt(raw, 10);
    return clamp(Number.isFinite(n) ? n : 4, 1, 16);
  }, [searchParams]);

  const initialContainers = useMemo<ContainersState>(() => {
    const base: ContainersState = { unassigned: players.map((p) => p.id) };
    for (let i = 1; i <= groupsCount; i++) base[`group-${i}`] = [];
    return base;
  }, [players, groupsCount]);

  const [containers, setContainers] = useState<ContainersState>(initialContainers);

  const idToPlayer = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  function findContainerByPlayerId(playerId: string): ContainerId | null {
    for (const [cid, list] of Object.entries(containers)) {
      if (list.includes(playerId)) return cid;
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const playerId = String(active.id);
    const to = String(over.id);

    if (!Object.prototype.hasOwnProperty.call(containers, to)) return;

    const from = findContainerByPlayerId(playerId);
    if (!from || from === to) return;

    setContainers((prev) => {
      const next: ContainersState = { ...prev };
      // remove from source
      next[from] = next[from].filter((id) => id !== playerId);
      // add to destination (ensure unique)
      if (!next[to].includes(playerId)) next[to] = [...next[to], playerId];
      return next;
    });
  }

  // Build columns data
  const groups = Array.from({ length: groupsCount }, (_, i) => `group-${i + 1}` as const);

  return (
    <div className="mx-6 md:mx-16 lg:mx-32 xl:mx-60 2xl:mx-80 grid gap-6 grid-cols-8 items-start">
      <h1 className="col-span-full text-2xl font-semibold">Assign players to groups</h1>

      <DndContext onDragEnd={handleDragEnd}>
        {/* Left: Unassigned players */}
        <div className="col-span-8 lg:col-span-3 space-y-4">
          <DroppableColumn id="unassigned" title="Players">
            {containers.unassigned.map((pid) => (
              <DraggablePlayer key={pid} player={idToPlayer[pid]} />
            ))}
          </DroppableColumn>
        </div>

        {/* Right: Groups grid */}
        <form id="teamForm" className="col-span-8 lg:col-span-5 space-y-6">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(groupsCount, 4)}, minmax(0, 1fr))` }}
          >
            {groups.map((gid, idx) => (
              <DroppableColumn key={gid} id={gid} title={`Group ${idx + 1}`}>
                {containers[gid].map((pid) => (
                  <DraggablePlayer key={pid} player={idToPlayer[pid]} />
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
      <Button type="submit" className="w-full col-span-full" aria-disabled={false} form="teamForm">
        Continue
      </Button>
    </div>
  );
}


export default function TeamsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamsContent />
    </Suspense>
  );
}
