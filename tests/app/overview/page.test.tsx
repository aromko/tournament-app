import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoist a shared mock so both the mocked module and tests use the same fn reference
const h = vi.hoisted(() => ({
  getTournaments: vi.fn<[], Promise<Array<{ id: number; name: string }>>>(),
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

  it('renders a list of tournaments by name', async () => {
    h.getTournaments.mockResolvedValueOnce([
      { id: 1, name: 'Spring Open' },
      { id: 2, name: 'Summer Cup' },
    ])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    // List rendered with two items
    expect(screen.getByRole('list')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(screen.getByText('Spring Open')).toBeInTheDocument()
    expect(screen.getByText('Summer Cup')).toBeInTheDocument()

    expect(h.getTournaments).toHaveBeenCalledTimes(1)
  })

  it('renders an empty list when there are no tournaments', async () => {
    h.getTournaments.mockResolvedValueOnce([])

    const { default: OverviewPage } = await import('@/app/overview/page')

    const ui = await OverviewPage()
    render(ui)

    // UL exists but with zero list items
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)

    expect(h.getTournaments).toHaveBeenCalledTimes(1)
  })
})
