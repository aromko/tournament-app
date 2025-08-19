import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoist a shared mock reference so both the mocked module and tests use the same fn
const h = vi.hoisted(() => ({
  findMany: vi.fn<[], any>(),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    player: {
      findMany: h.findMany,
    },
  },
}))

describe('API GET /api/tournament/[id]/players', () => {
  beforeEach(() => {
    h.findMany.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid id', async () => {
    const { GET } = await import('@/app/api/tournament/[id]/players/route')

    const req = new Request('http://localhost/api/tournament/abc/players')
    const res = await GET(req, { params: Promise.resolve({ id: 'abc' }) } as any)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ message: 'Invalid id' })
    expect(h.findMany).not.toHaveBeenCalled()
  })

  it('returns 200 with players for valid id and calls prisma with correct args', async () => {
    h.findMany.mockResolvedValueOnce([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
    const { GET } = await import('@/app/api/tournament/[id]/players/route')

    const req = new Request('http://localhost/api/tournament/42/players')
    const res = await GET(req, { params: Promise.resolve({ id: '42' }) } as any)

    expect(h.findMany).toHaveBeenCalledWith({
      where: { tournamentId: 42 },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  })

  it('returns 500 when prisma throws an error', async () => {
    h.findMany.mockRejectedValueOnce(new Error('DB down'))
    const { GET } = await import('@/app/api/tournament/[id]/players/route')

    const req = new Request('http://localhost/api/tournament/5/players')
    const res = await GET(req, { params: Promise.resolve({ id: '5' }) } as any)

    expect(res.status).toBe(500)
    const body = await res.json()
    // Only check the prefix to avoid depending on Error.toString formatting
    expect(body.message).toMatch(/^Error: /)
  })
})
