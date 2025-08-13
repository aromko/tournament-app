import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSearchParams } from "next/navigation";
import { ContainersState } from "@/hooks/useHandleDragEnd";
import { Player, UNASSIGNED_ID } from "@/app/setup/teams/[id]/TeamsAssignment";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseGroupCount(params: ReturnType<typeof useSearchParams>) {
  const raw = params.get("groups") ?? params.get("g") ?? "4";
  const n = Number.parseInt(raw, 10);

  return clamp(Number.isFinite(n) ? n : 4, 1, 16);
}

export function buildInitialState(
  list: Player[],
  count: number,
  unassignedId: typeof UNASSIGNED_ID,
): ContainersState {
  const base: ContainersState = { [unassignedId]: list.map((p) => p.id) };
  for (let i = 1; i <= count; i++) base[`group-${i}`] = [];

  return base;
}

export function buildGroupIds(count: number) {
  return Array.from({ length: count }, (_, i) => `group-${i + 1}` as const);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
