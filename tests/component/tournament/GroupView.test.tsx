import { render, screen } from "@testing-library/react";
import React from "react";
import GroupView from "@/app/tournament/[id]/GroupView";
import type { StandingRow } from "@/prisma/db/standing";

function makeStanding(overrides: Partial<StandingRow> & { player: { id: number; name: string } }): StandingRow {
  return {
    id: 1,
    tournamentId: 1,
    playerId: 1,
    groupNumber: 1,
    games: 0,
    wins: 0,
    losses: 0,
    diff: 0,
    points: 0,
    rank: 1,
    ...overrides,
  };
}

describe("GroupView", () => {
  it("renders group headings for each group", () => {
    render(
      <GroupView numberOfGroups={2} groupStandings={{ 1: [], 2: [] }} />,
    );

    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(screen.getByText("Group 2")).toBeInTheDocument();
  });

  it("shows empty state when a group has no players", () => {
    render(
      <GroupView numberOfGroups={1} groupStandings={{ 1: [] }} />,
    );

    expect(screen.getByText("No players in this group.")).toBeInTheDocument();
  });

  it("renders player standings with stats", () => {
    const standings: Record<number, StandingRow[]> = {
      1: [
        makeStanding({
          id: 1,
          playerId: 1,
          rank: 1,
          player: { id: 1, name: "Alice" },
          games: 3,
          wins: 2,
          losses: 1,
          diff: 8,
          points: 4,
        }),
        makeStanding({
          id: 2,
          playerId: 2,
          rank: 2,
          player: { id: 2, name: "Bob" },
          games: 3,
          wins: 1,
          losses: 2,
          diff: -8,
          points: 2,
        }),
      ],
    };

    render(<GroupView numberOfGroups={1} groupStandings={standings} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    // Check win/loss format
    expect(screen.getByText("2:1")).toBeInTheDocument();
    expect(screen.getByText("1:2")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <GroupView
        numberOfGroups={1}
        groupStandings={{
          1: [
            makeStanding({ player: { id: 1, name: "X" } }),
          ],
        }}
      />,
    );

    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Win/Loss")).toBeInTheDocument();
    expect(screen.getByText("Diff")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
  });
});
