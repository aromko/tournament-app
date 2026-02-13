import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Utility to mock React.useActionState for this file
function mockUseActionState(state: unknown, isPending = false) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spy = vi.spyOn(
    React as unknown as Record<string, any>,
    "useActionState",
  );
  spy.mockReturnValue([state, vi.fn(), isPending]);
  return spy;
}

// Centralized mocks for next/navigation to avoid hoisting conflicts
const useSearchParamsMock = vi.fn<() => URLSearchParams>();
const useParamsMock = vi.fn<() => { id?: string }>();
vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useSearchParams: () => useSearchParamsMock(),
    useParams: () => useParamsMock(),
  };
});

describe("PlayerPage (/setup/player/[id])", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    useSearchParamsMock.mockReset();
    useParamsMock.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders NotFound when no ?p is provided", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    useParamsMock.mockReturnValue({ id: "1" });

    mockUseActionState({});
    const { default: PlayerPage } =
      await import("@/app/setup/player/[id]/page");

    render(<PlayerPage />);

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("renders N player inputs when ?p is provided and increments on Add Player", async () => {
    const user = userEvent.setup();
    useSearchParamsMock.mockReturnValue(new URLSearchParams([["p", "5"]]));
    useParamsMock.mockReturnValue({ id: "10" });

    mockUseActionState({});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);

    const { default: PlayerPage } =
      await import("@/app/setup/player/[id]/page");

    render(<PlayerPage />);

    // Wait until effect and fetch settle and ensure 5 inputs are present
    const inputs = await screen.findAllByRole("textbox");
    expect(inputs.length).toBe(5);

    // Click Add Player increases to 6
    await user.click(screen.getByRole("button", { name: /add player/i }));
    await screen.findAllByRole("textbox");
    expect(screen.getAllByRole("textbox").length).toBe(6);

    fetchMock.mockRestore();
  });

  it("overrides player count with existing players from fetch", async () => {
    // initial p=2, but fetch returns 3 players
    useSearchParamsMock.mockReturnValue(new URLSearchParams([["p", "2"]]));
    useParamsMock.mockReturnValue({ id: "55" });

    mockUseActionState({});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ],
    } as unknown as Response);

    const { default: PlayerPage } =
      await import("@/app/setup/player/[id]/page");

    render(<PlayerPage />);

    // After fetch, players count should become 3
    await waitFor(() => {
      expect(screen.getAllByRole("textbox").length).toBe(3);
    });

    fetchMock.mockRestore();
  });

  it("shows error alert when action state returns message", async () => {
    // Use the centralized mocks instead of re-mocking the module
    useSearchParamsMock.mockReturnValue(new URLSearchParams([["p", "4"]]));
    useParamsMock.mockReturnValue({ id: "9" });

    const state = { message: "Something went wrong" };
    mockUseActionState(state);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);

    const { default: PlayerPage } =
      await import("@/app/setup/player/[id]/page");
    render(<PlayerPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    fetchMock.mockRestore();
  });
});
