import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock the server action module to prevent client-side import of server code
vi.mock("@/app/tournament/[id]/actions", () => ({
  saveMatchScore: vi.fn(),
}));

import TournamentView from "@/app/tournament/[id]/TournamentView";
import type { StandingRow } from "@/prisma/db/standing";
import type { MatchRow } from "@/prisma/db/match";

function makeStanding(
  overrides: Partial<StandingRow> & { player: { id: number; name: string } },
): StandingRow {
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
    player1: { id: 1, name: "Player 1" },
    player2: { id: 2, name: "Player 2" },
    ...overrides,
  };
}

const defaultProps = {
  tournamentName: "Test Cup",
  tournamentId: 1,
  numberOfGroups: 1,
  groupStandings: {
    1: [
      makeStanding({ player: { id: 1, name: "Alice" } }),
      makeStanding({
        id: 2,
        playerId: 2,
        rank: 2,
        player: { id: 2, name: "Bob" },
      }),
    ],
  },
  groupMatches: {
    1: [
      makeMatch({
        player1: { id: 1, name: "Alice" },
        player2: { id: 2, name: "Bob" },
      }),
    ],
  },
};

describe("TournamentView", () => {
  it("renders tournament name", () => {
    render(<TournamentView {...defaultProps} />);
    expect(screen.getByText("Test Cup")).toBeInTheDocument();
  });

  it("shows Groups view by default", () => {
    render(<TournamentView {...defaultProps} />);

    // Group view should be visible with standings table headers
    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("switches to Matches view when Matches button is clicked", async () => {
    const user = userEvent.setup();
    render(<TournamentView {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Matches" }));

    // Match view should show player names and score inputs
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    // Standings table headers should not be present
    expect(screen.queryByText("Rank")).not.toBeInTheDocument();
  });

  it("switches back to Groups view", async () => {
    const user = userEvent.setup();
    render(<TournamentView {...defaultProps} />);

    // Go to matches
    await user.click(screen.getByRole("button", { name: "Matches" }));
    expect(screen.queryByText("Rank")).not.toBeInTheDocument();

    // Go back to groups
    await user.click(screen.getByRole("button", { name: "Groups" }));
    expect(screen.getByText("Rank")).toBeInTheDocument();
  });

  it("renders both toggle buttons", () => {
    render(<TournamentView {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Groups" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Matches" }),
    ).toBeInTheDocument();
  });
});
