import { render, screen } from '@testing-library/react'
import React from 'react'

// No CSS imports here; SetupLayout doesn't import globals.css

// Centralized mock for next/navigation.usePathname to avoid hoisting issues
const usePathnameMock = vi.fn<() => string>()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return {
    ...actual,
    usePathname: () => usePathnameMock(),
  }
})

describe('SetupLayout (/setup)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePathnameMock.mockReset()
  })

  it('renders title/description for /setup and children', async () => {
    usePathnameMock.mockReturnValue('/setup')

    const { default: SetupLayout } = await import('@/app/setup/layout')

    render(
      <SetupLayout>
        <div data-testid="child">Content</div>
      </SetupLayout>
    )

    expect(screen.getByRole('heading', { name: /create tournament/i })).toBeInTheDocument()
    expect(screen.getByText(/fill in the tournament details/i)).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Content')
  })

  it('renders title/description for /setup/player/[id]', async () => {
    usePathnameMock.mockReturnValue('/setup/player/123')

    const { default: SetupLayout } = await import('@/app/setup/layout')

    render(
      <SetupLayout>
        <div data-testid="child">Players</div>
      </SetupLayout>
    )

    expect(screen.getByRole('heading', { name: /add players/i })).toBeInTheDocument()
    expect(screen.getByText(/please enter player names/i)).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Players')
  })

  it('renders title/description for /setup/teams/[id]', async () => {
    usePathnameMock.mockReturnValue('/setup/teams/abc')

    const { default: SetupLayout } = await import('@/app/setup/layout')

    render(
      <SetupLayout>
        <div data-testid="child">Teams</div>
      </SetupLayout>
    )

    expect(screen.getByRole('heading', { name: /assign players to groups/i })).toBeInTheDocument()
    expect(screen.getByText(/drag and drop players into groups/i)).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Teams')
  })

  it('renders only children when no matching setup path', async () => {
    usePathnameMock.mockReturnValue('/setup/unknown')

    const { default: SetupLayout } = await import('@/app/setup/layout')

    render(
      <SetupLayout>
        <div data-testid="child">Just children</div>
      </SetupLayout>
    )

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('Just children')
  })
})
