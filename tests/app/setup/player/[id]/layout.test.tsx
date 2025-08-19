/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'

// Centralized mocks for this file
const redirectMock = vi.fn<(path: string) => void>()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return {
    ...actual,
    redirect: (...args: Parameters<typeof actual.redirect>) => redirectMock(...(args as unknown as [string])),
  }
})

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    tournament: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Player Setup Layout (/setup/player/[id]/layout)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    redirectMock.mockReset()
  })

  it('redirects to "/" when tournament has already started', async () => {
    const { default: prisma } = (await import('@/lib/prisma')) as any
    ;(prisma.tournament.findUnique as any).mockResolvedValue({ started: true })

    const { default: Layout } = await import('@/app/setup/player/[id]/layout')

    // Call the async layout with params and some children
    // We do not need to render the result; just assert redirect is invoked
    await Layout({
      params: Promise.resolve({ id: '7' }),
      children: <div data-testid="child">X</div>,
    } as any)

    expect(redirectMock).toHaveBeenCalledWith('/')
  })

  it('renders children when tournament has not started', async () => {
    const { default: prisma } = (await import('@/lib/prisma')) as any
    ;(prisma.tournament.findUnique as any).mockResolvedValue({ started: false })

    const { default: Layout } = await import('@/app/setup/player/[id]/layout')

    const element = await Layout({
      params: Promise.resolve({ id: '12' }),
      children: <div data-testid="child">Content</div>,
    } as any)

    render(element as React.ReactElement)
    expect(screen.getByTestId('child')).toHaveTextContent('Content')
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('renders children when tournament is not found (null)', async () => {
    const { default: prisma } = (await import('@/lib/prisma')) as any
    ;(prisma.tournament.findUnique as any).mockResolvedValue(null)

    const { default: Layout } = await import('@/app/setup/player/[id]/layout')

    const element = await Layout({
      params: Promise.resolve({ id: '3' }),
      children: <div data-testid="child">Kids</div>,
    } as any)

    render(element as React.ReactElement)
    expect(screen.getByTestId('child')).toHaveTextContent('Kids')
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('does not query prisma and renders children when id is non-numeric', async () => {
    const { default: prisma } = (await import('@/lib/prisma')) as any

    const { default: Layout } = await import('@/app/setup/player/[id]/layout')

    const element = await Layout({
      params: Promise.resolve({ id: 'abc' }),
      children: <div data-testid="child">Alpha</div>,
    } as any)

    render(element as React.ReactElement)
    expect(screen.getByTestId('child')).toHaveTextContent('Alpha')
    expect((prisma.tournament.findUnique as any)).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
