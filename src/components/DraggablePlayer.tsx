import { useDraggable } from "@dnd-kit/core";
import { Player } from "@/app/setup/teams/[id]/TeamsAssignment";
import React, { FC } from "react";

 type DraggablePlayerProps = { player: Player; onRemove?: () => void };

export const DraggablePlayer: FC<DraggablePlayerProps> = ({ player, onRemove }) => {
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
      className="flex items-center justify-between gap-3 select-none cursor-grab active:cursor-grabbing px-3 py-2 rounded-md border bg-background shadow-sm text-sm"
      style={style}
    >
      <span className="truncate">{player.name}</span>
      {onRemove ? (
        <button
          type="button"
          onPointerDown={(e) => {
            // Prevent dnd-kit from starting a drag when clicking the remove button
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            // Some browsers fire mouse events instead of pointer events
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 text-xs px-2 py-1 border rounded hover:bg-accent"
          aria-label={`Remove ${player.name}`}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
};
