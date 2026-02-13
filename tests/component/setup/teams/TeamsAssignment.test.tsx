import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamsAssignment, {
  type Player,
} from "@/app/setup/teams/[id]/TeamsAssignment";
import React from "react";

// Override navigation mocks for this test to ensure deterministic group count and params
vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams([["groups", "2"]]),
    useParams: () => ({ id: "t1" }),
  };
});

function getUnassignedContainer() {
  // The unassigned column is labeled by a heading "Players"
  const heading = screen.getByRole("heading", { name: /players/i });
  // The container is the next sibling div following the heading inside DroppableColumn
  return heading.parentElement as HTMLElement;
}

describe("TeamsAssignment component", () => {
  it("disables Start initially and renders 2 groups (Arrange-Act-Assert)", async () => {
    // Arrange
    const user = userEvent.setup();
    const players: Player[] = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Cara" },
      { id: "4", name: "Dan" },
    ];

    // Act
    render(<TeamsAssignment players={players} />);

    // Assert
    expect(screen.getAllByRole("heading", { name: /group \d+/i }).length).toBe(
      2,
    );
    await user.click(screen.getByRole("button", { name: /more actions/i }));
    const startItem = await screen.findByRole("menuitem", {
      name: /start tournament/i,
    });
    expect(startItem).toBeDisabled();
  });

  it("shuffle distributes players and enables Start (Arrange-Act-Assert)", async () => {
    // Arrange
    const user = userEvent.setup();
    const players: Player[] = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Cara" },
      { id: "4", name: "Dan" },
    ];
    render(<TeamsAssignment players={players} />);

    // Act
    await user.click(screen.getByRole("button", { name: /shuffle/i }));

    // Assert
    const unassigned = getUnassignedContainer();
    expect(
      within(unassigned).queryAllByRole("button", { name: /remove/i }).length,
    ).toBe(0);

    // Now open the menu and ensure Start is enabled
    await user.click(screen.getByRole("button", { name: /more actions/i }));
    const startItem = await screen.findByRole("menuitem", {
      name: /start tournament/i,
    });
    expect(startItem).toBeEnabled();
  });

  it("adds a new group via Actions menu (Arrange-Act-Assert)", async () => {
    // Arrange
    const user = userEvent.setup();
    const players: Player[] = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Cara" },
      { id: "4", name: "Dan" },
    ];
    render(<TeamsAssignment players={players} />);

    // Act
    await user.click(screen.getByRole("button", { name: /^Actions$/i }));
    await user.click(screen.getByText("Add Group"));

    // Assert
    expect(screen.getAllByRole("heading", { name: /group \d+/i }).length).toBe(
      3,
    );
  });
});
