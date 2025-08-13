import { Dispatch, SetStateAction, useCallback } from "react";
import { type DragEndEvent } from "@dnd-kit/core";
import { type ContainerId } from "@/components/DroppableColumn";

export type ContainersState = Record<ContainerId, string[]>; // containerId -> array of playerIds

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

export function useHandleDragEnd(
  containers: ContainersState,
  setContainers: Dispatch<SetStateAction<ContainersState>>,
) {
  const getContainerIdByPlayer = useCallback(
    (playerId: string): ContainerId | null => {
      for (const [cid, list] of Object.entries(containers)) {
        if (list.includes(playerId)) return cid as ContainerId;
      }
      return null;
    },
    [containers],
  );

  return useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const playerId = String(active.id);
      const to = String(over.id) as ContainerId;

      // Validate destination container
      if (!(to in containers)) return;

      const from = getContainerIdByPlayer(playerId);
      if (!from || from === to) return;

      setContainers((prev) => movePlayer(prev, from, to, playerId));
    },
    [containers, getContainerIdByPlayer, setContainers],
  );
}
