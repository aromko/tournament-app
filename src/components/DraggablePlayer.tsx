import { useDraggable } from "@dnd-kit/core";
import { Player } from "@/app/setup/teams/[id]/TeamsAssignment";
import { FC } from "react";

type DraggablePlayerProps = { player: Player };

export const DraggablePlayer: FC<DraggablePlayerProps> = ({ player }) => {
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
