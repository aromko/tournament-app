import { render, screen } from "@testing-library/react";
import React from "react";

// Stable module-level mock for React.useActionState with mutable bindings
let __mockActionState: unknown = null;
let __mockIsPending = false;
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    // @ts-expect-error tuple return
    useActionState: () => [__mockActionState, vi.fn(), __mockIsPending],
  };
});

// Helper to set the mocked values per test
function mockUseActionStateTriplet(state: unknown, isPending = false) {
  __mockActionState = state;
  __mockIsPending = isPending;
  // return a dummy object to keep afterEach(actionStateSpy?.mockRestore()) harmless
  return { mockRestore: () => {} } as unknown as ReturnType<typeof vi.spyOn>;
}

describe('SetupPage (/setup)', () => {
  let actionStateSpy: ReturnType<typeof mockUseActionStateTriplet>;

  beforeEach(() => {
    vi.resetModules();
    // Removed vi.unmock('next/navigation') because it doesn't undo explicit vi.mock from setup
  });

  afterEach(() => {
    actionStateSpy?.mockRestore();
  })

  it('renders basic form with defaults', async () => {
    // useSearchParams -> empty
    vi.mock('next/navigation', () => ({
      useSearchParams: () => new URLSearchParams(),
    }))

    actionStateSpy = mockUseActionStateTriplet(null, false);
    const { default: SetupPage } = await import('@/app/setup/page')

    render(<SetupPage />)

    // Name input exists and is empty by default
    const name = screen.getByLabelText(/tournament name/i) as HTMLInputElement
    expect(name.value).toBe('')

    // Players input defaults to 4
    const players = screen.getByLabelText(/number of players/i) as HTMLInputElement
    expect(players.value).toBe('4')

    // Two selects present (labels visible for elimination type and number of groups)
    // Note: shadcn/Radix SelectTrigger isn't label-associated in the DOM, so getByLabelText won't find a control.
    expect(screen.getByText(/elimination type/i)).toBeInTheDocument()
    expect(screen.getByText(/number of groups/i)).toBeInTheDocument()
  })

  it('shows validation errors and message from action state', async () => {
    vi.mock('next/navigation', async () => {
      const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
      return { ...actual, useSearchParams: () => new URLSearchParams() }
    })

    const state = {
      errors: {
        name: ['Name is required'],
        players: ['Players must be >= 4'],
        eliminationType: ['Pick one'],
        numberOfGroups: ['Pick groups'],
      },
      message: 'Validation failed',
    }
    actionStateSpy = mockUseActionStateTriplet(state, false);

    const { default: SetupPage } = await import('@/app/setup/page')

    render(<SetupPage />)

    expect(await screen.findByText('Validation failed')).toBeInTheDocument()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Players must be >= 4')).toBeInTheDocument()
    expect(screen.getByText('Pick one')).toBeInTheDocument()
    expect(screen.getByText('Pick groups')).toBeInTheDocument()
  })
})