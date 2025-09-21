import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoist a shared mock so both the mocked module and tests use the same fn reference
const h = vi.hoisted(() => ({
  getTournaments: vi.fn(),
}))

vi.mock('@/prisma/db', () => ({
  getTournaments: h.getTournaments,
}))

describe('OverviewPage (/overview)', () => {
  beforeEach(() => {
    h.getTournaments.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders tournaments in a data table with name, status and actions', async () => {
    h.getTournaments.mockResolvedValueOnce([
      { id: 1, name: 'Spring Open' },
      { id: 2, name: 'Summer Cup' },
    ])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    // Table and headers
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Actions/i })).toBeInTheDocument()

    // Row content
    expect(screen.getByText('Spring Open')).toBeInTheDocument()
    expect(screen.getByText('Summer Cup')).toBeInTheDocument()
    // Default status is Not started when not provided
    expect(screen.getAllByText('Not started')).toHaveLength(2)

    // Action buttons exist (menu triggers)
    expect(screen.getAllByRole('button', { name: /Actions for/i })).toHaveLength(2)

    expect(h.getTournaments).toHaveBeenCalledTimes(1)
  })

  it('renders an empty table body when there are no tournaments', async () => {
    h.getTournaments.mockResolvedValueOnce([])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    const [_, tbody] = screen.getAllByRole('rowgroup')
    expect(within(tbody).queryAllByRole('row')).toHaveLength(0)

    expect(h.getTournaments).toHaveBeenCalledTimes(1)
  })

  it('opens a Register dialog to add a player name', async () => {
    h.getTournaments.mockResolvedValueOnce([
      { id: 1, name: 'Spring Open' },
    ])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    // Open actions menu
    const actionsBtn = screen.getByRole('button', { name: /Actions for Spring Open/i })
    await userEvent.click(actionsBtn)

    // Click Register
    const registerItem = await screen.findByRole('menuitem', { name: /Register/i })
    await userEvent.click(registerItem)

    // Dialog should appear
    expect(await screen.findByText(/Register Player/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Player Name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Player/i })).toBeInTheDocument()
  })

  it('shows only "View" action for started tournaments', async () => {
    h.getTournaments.mockResolvedValueOnce([
      { id: 1, name: 'Championship Finals', started: true },
    ])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    // Status should indicate started
    expect(screen.getByText('Started')).toBeInTheDocument()

    // Open actions menu
    const actionsBtn = screen.getByRole('button', { name: /Actions for Championship Finals/i })
    await userEvent.click(actionsBtn)

    // Only View should be present
    expect(await screen.findByRole('menuitem', { name: /View/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Register/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Setup/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Start/i })).not.toBeInTheDocument()
  })
})
