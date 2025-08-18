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
  const groupIds = useMemo(() => buildGroupIds(groupCountState), [groupCountState]);

  const gridColumnCount = useMemo(() => Math.min(groupCountState, 4), [groupCountState]);
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

  const handleAddGroup = () => {
    setGroupCountState((prev) => {
      const next = Math.min(prev + 1, 16);
      setContainers((prevC) => {
        const key = `group-${next}` as const;
        if (prevC[key]) return prevC;
        return { ...prevC, [key]: [] } as ContainersState;
      });
      return next;
    });
  };

  const handleShuffle = () => {
    // Gather all non-removed players currently in any container
    const all: string[] = [];
    for (const [cid, list] of Object.entries(containers)) {
      if (cid === UNASSIGNED_ID || cid.startsWith("group-")) {
        all.push(...list);
      }
    }
    // Shuffle players
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    const ids = groupIds;
    const next: ContainersState = { [UNASSIGNED_ID]: [] } as ContainersState;
    for (const gid of ids) next[gid] = [];
    all.forEach((pid, idx) => {
      const gid = ids[idx % ids.length];
      next[gid].push(pid);
    });

    setContainers(next);
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
          {/* Persist number of groups */}
          <input type="hidden" name="numberOfGroups" value={`${groupCountState}`} />
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
        onClick={handleAddGroup}
      >
        Add Group
      </Button>
      <Button
        type="button"
        className="w-full col-end-7 col-span-2"
        aria-disabled={isPending}
        variant="secondary"
        onClick={handleShuffle}
      >
        Shuffle
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
