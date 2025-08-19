import React from "react";
import { render, screen } from "@testing-library/react";

// Mock TeamsAssignment to capture props and render a marker
const assignmentSpy = vi.fn((props: any) => React.createElement('div', { 'data-testid': 'teams-assignment' }, JSON.stringify(props)))
vi.mock('@/app/setup/teams/[id]/TeamsAssignment', () => ({
  __esModule: true,
  default: assignmentSpy,
}))

// Mock players DB accessor
vi.mock('@/prisma/db/player', () => ({
  getPlayersByTournamentId: vi.fn(),
}))

// Mock prisma client
vi.mock('@/lib/prisma', () => ({
  default: {
    tournament: {
      findUnique: vi.fn(),
    },
  },
}))

// We will override redirect behavior per test

describe('TeamsPage (/setup/teams/[id])', () => {
  beforeEach(() => {
    vi.resetModules()
    assignmentSpy.mockClear()
  })

  it('renders TeamsAssignment with mapped players when tournament not started', async () => {
    const { default: prisma } = await import('@/lib/prisma') as any
    ;(prisma.tournament.findUnique as any).mockResolvedValue({ started: false })

    const { getPlayersByTournamentId } = await import('@/prisma/db/player') as any
    ;(getPlayersByTournamentId as any).mockResolvedValue([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])

    // Provide a noop redirect to avoid throwing
    vi.mock('next/navigation', async () => {
      const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
      return { ...actual, redirect: vi.fn() }
    })

    const { default: TeamsPage } = await import('@/app/setup/teams/[id]/page')

    // Render the returned element
    const element = await TeamsPage({ params: Promise.resolve({ id: '5' }) } as any)
    render(element as React.ReactElement)

    // Ensure our mocked TeamsAssignment rendered and received string ids
    const node = await screen.findByTestId('teams-assignment')
    expect(node).toBeInTheDocument()

    // parse props from rendered JSON text
    const props = JSON.parse(node.textContent || '{}')
    expect(props.players).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
  })
})
