import { useDroppable } from "@dnd-kit/core";
import React, { FC, ReactNode } from "react";

export type ContainerId = string;
type DroppableColumnProps = {
  id: ContainerId;
  title: string;
  children?: ReactNode;
};

export const DroppableColumn: FC<DroppableColumnProps> = ({
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
