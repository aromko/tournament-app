import { describe, it, expect } from "vitest";
import { parseGroupCount, buildGroupIds, buildInitialState } from "@/lib/utils";
import {
  UNASSIGNED_ID,
  type Player,
} from "@/app/setup/teams/[id]/TeamsAssignment";
import type { useSearchParams } from "next/navigation";

function sp(params?: Record<string, string>) {
  const usp = new URLSearchParams(params);
  // cast to satisfy type expectations in parseGroupCount
  return usp as unknown as ReturnType<typeof useSearchParams>;
}

describe("lib/utils", () => {
  it("parseGroupCount returns default when missing", () => {
    // Arrange
    const usp = sp();
    // Act
    const result = parseGroupCount(usp);
    // Assert
    expect(result).toBe(4);
  });

  it('parseGroupCount respects alias "g" and clamps low (Arrange-Act-Assert)', () => {
    expect(parseGroupCount(sp({ g: "0" }))).toBe(1);
  });

  it("parseGroupCount clamps high values (Arrange-Act-Assert)", () => {
    expect(parseGroupCount(sp({ groups: "100" }))).toBe(16);
  });

  it("parseGroupCount returns valid numeric value (Arrange-Act-Assert)", () => {
    expect(parseGroupCount(sp({ groups: "3" }))).toBe(3);
  });

  it("parseGroupCount falls back to default for NaN (Arrange-Act-Assert)", () => {
    expect(parseGroupCount(sp({ groups: "NaN" }))).toBe(4);
  });

  it("buildGroupIds returns deterministic ids", () => {
    expect(buildGroupIds(3)).toEqual(["group-1", "group-2", "group-3"]);
  });

  it("buildInitialState puts all players in unassigned and creates empty groups", () => {
    const players: Player[] = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ];
    const state = buildInitialState(players, 2, UNASSIGNED_ID);
    expect(state[UNASSIGNED_ID]).toEqual(["1", "2"]);
    expect(state["group-1"]).toEqual([]);
    expect(state["group-2"]).toEqual([]);
  });
});
