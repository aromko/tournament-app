import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the server action to prevent client-side import of server code
vi.mock("@/app/tournament/[id]/actions", () => ({
  saveMatchScore: vi.fn(),
}));

import MatchView from "@/app/tournament/[id]/MatchView";
import type { MatchRow } from "@/prisma/db/match";

function makeMatch(overrides: Partial<MatchRow>): MatchRow {
  return {
    id: 1,
    tournamentId: 1,
    groupNumber: 1,
    player1Id: 1,
    player2Id: 2,
    score1: null,
    score2: null,
    played: false,
    player1: { id: 1, name: "Player A" },
    player2: { id: 2, name: "Player B" },
    ...overrides,
  };
}

describe("MatchView", () => {
  it("renders group headings", () => {
    render(
      <MatchView numberOfGroups={2} groupMatches={{ 1: [], 2: [] }} />,
    );

    expect(screen.getByText("Group 1")).toBeInTheDocument();
    expect(screen.getByText("Group 2")).toBeInTheDocument();
  });

  it("shows empty state when no matches exist", () => {
    render(
      <MatchView numberOfGroups={1} groupMatches={{ 1: [] }} />,
    );

    expect(screen.getByText("No matches in this group.")).toBeInTheDocument();
  });

  it("renders match rows with player names", () => {
    const matches: Record<number, MatchRow[]> = {
      1: [
        makeMatch({
          id: 1,
          player1: { id: 1, name: "Alice" },
          player2: { id: 2, name: "Bob" },
        }),
        makeMatch({
          id: 2,
          player1Id: 1,
          player2Id: 3,
          player1: { id: 1, name: "Alice" },
          player2: { id: 3, name: "Cara" },
        }),
      ],
    };

    render(<MatchView numberOfGroups={1} groupMatches={matches} />);

    // Both match rows should show player names
    expect(screen.getAllByText("Alice")).toHaveLength(2);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Cara")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    const matches: Record<number, MatchRow[]> = {
      1: [makeMatch({})],
    };

    render(<MatchView numberOfGroups={1} groupMatches={matches} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
  });

  it("renders Save buttons for each match", () => {
    const matches: Record<number, MatchRow[]> = {
      1: [
        makeMatch({ id: 1 }),
        makeMatch({ id: 2 }),
      ],
    };

    render(<MatchView numberOfGroups={1} groupMatches={matches} />);

    expect(screen.getAllByRole("button", { name: "Save" })).toHaveLength(2);
  });

  it("pre-fills scores for played matches", () => {
    const matches: Record<number, MatchRow[]> = {
      1: [
        makeMatch({
          id: 1,
          played: true,
          score1: 11,
          score2: 7,
          player1: { id: 1, name: "Alice" },
          player2: { id: 2, name: "Bob" },
        }),
      ],
    };

    render(<MatchView numberOfGroups={1} groupMatches={matches} />);

    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(11);
    expect(inputs[1]).toHaveValue(7);
  });
});
