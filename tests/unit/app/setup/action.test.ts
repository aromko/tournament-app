import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Hoisted shared mocks for prisma and redirect
const h = vi.hoisted(() => ({
  prisma: {
    tournament: {
      create: vi.fn(),
      update: vi.fn(),
    },
    player: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  tx: {
    player: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    tournament: {
      update: vi.fn(),
    },
  },
  redirect: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  default: h.prisma,
}))

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation')
  return { ...actual, redirect: h.redirect }
})

describe('setup actions', () => {
  beforeEach(() => {
    // reset all mocks between tests
    vi.clearAllMocks()
    // $transaction calls the callback with our tx mock
    h.prisma.$transaction.mockImplementation(async (cb: any) => cb(h.tx))
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('createTournament', () => {
    it('creates a new tournament and redirects with players count', async () => {
      const { createTournament } = await import('@/app/setup/action')

      h.prisma.tournament.create.mockResolvedValueOnce({ id: 77 })

      const fd = new FormData()
      fd.set('name', 'Summer Cup')
      fd.set('players', '8')
      fd.set('eliminationType', 'SINGLE')
      fd.set('numberOfGroups', '4')

      const res = await createTournament(null, fd)

      expect(h.prisma.tournament.create).toHaveBeenCalledWith({
        data: { name: 'Summer Cup', eliminationType: 'SINGLE', numberOfGroups: 4 },
      })
      expect(h.redirect).toHaveBeenCalledWith('/setup/player/77?p=8')
      expect(res).toBeUndefined() // redirect stops further return
    })

    it('updates an existing tournament when tournamentId is provided', async () => {
      const { createTournament } = await import('@/app/setup/action')

      h.prisma.tournament.update.mockResolvedValueOnce({ id: 5 })

      const fd = new FormData()
      fd.set('tournamentId', '5')
      fd.set('name', 'Edited Cup')
      fd.set('players', '16')
      fd.set('eliminationType', 'MULTI')
      fd.set('numberOfGroups', '2')

      await createTournament(null, fd)

      expect(h.prisma.tournament.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { name: 'Edited Cup', eliminationType: 'MULTI', numberOfGroups: 2 },
      })
      expect(h.redirect).toHaveBeenCalledWith('/setup/player/5?p=16')
    })

    it('returns validation errors when input is invalid', async () => {
      const { createTournament } = await import('@/app/setup/action')

      const fd = new FormData()
      fd.set('name', 'A') // too short
      fd.set('players', '3') // too few
      fd.set('eliminationType', 'SINGLE')
      fd.set('numberOfGroups', 'NaN') // invalid

      const res = await createTournament(null, fd) as any

      expect(res).toBeTruthy()
      expect(res.errors).toBeTruthy()
      expect(Object.keys(res.errors)).toContain('name')
      expect(Object.keys(res.errors)).toContain('players')
    })
  })

  describe('createTournamentPlayers', () => {
    it('returns message when tournamentId missing or invalid', async () => {
      const { createTournamentPlayers } = await import('@/app/setup/action')

      let res = await createTournamentPlayers({}, new FormData()) as any
      expect(res.message).toMatch(/invalid tournament id/i)

      res = await createTournamentPlayers({ tournamentId: 'abc' }, new FormData()) as any
      expect(res.message).toMatch(/invalid tournament id/i)
    })

    it('upserts players and deletes extras, then redirects to teams page', async () => {
      const { createTournamentPlayers } = await import('@/app/setup/action')

      // Existing two players; submitted three with one changed
      h.tx.player.findMany.mockResolvedValueOnce([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])

      const fd = new FormData()
      fd.set('player_0', 'Alice')
      fd.set('player_1', 'Bobby') // will update id 2
      fd.set('player_2', 'Cara')  // will create new

      await createTournamentPlayers({ tournamentId: '9' }, fd)

      expect(h.tx.player.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { name: 'Bobby' } })
      expect(h.tx.player.create).toHaveBeenCalledWith({ data: { name: 'Cara', tournamentId: 9 } })
      // No deleteMany since we added one
      expect(h.tx.player.deleteMany).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith('/setup/teams/9')
    })
  })

  describe('deleteTournamentPlayer', () => {
    it('returns message when ids are invalid', async () => {
      const { deleteTournamentPlayer } = await import('@/app/setup/action')
      const fd = new FormData()
      fd.set('tournamentId', 'NaN')
      fd.set('playerId', '5')
      const res1 = await deleteTournamentPlayer(fd) as any
      expect(res1.message).toMatch(/invalid tournament or player id/i)

      const fd2 = new FormData()
      fd2.set('tournamentId', '7')
      fd2.set('playerId', 'oops')
      const res2 = await deleteTournamentPlayer(fd2) as any
      expect(res2.message).toMatch(/invalid tournament or player id/i)
    })

    it('deletes the player and redirects back to teams page', async () => {
      const { deleteTournamentPlayer } = await import('@/app/setup/action')
      const fd = new FormData()
      fd.set('tournamentId', '7')
      fd.set('playerId', '5')

      await deleteTournamentPlayer(fd)

      expect(h.prisma.player.deleteMany).toHaveBeenCalledWith({ where: { id: 5, tournamentId: 7 } })
      expect(h.redirect).toHaveBeenCalledWith('/setup/teams/7')
    })
  })

  describe('assignTournamentTeams', () => {
    it('returns message when tournamentId missing or invalid', async () => {
      const { assignTournamentTeams } = await import('@/app/setup/action')

      let res = await assignTournamentTeams({}, new FormData()) as any
      expect(res.message).toMatch(/invalid tournament id/i)

      res = await assignTournamentTeams({ tournamentId: 'NaN' }, new FormData()) as any
      expect(res.message).toMatch(/invalid tournament id/i)
    })

    it('applies removals and assignments, updates tournament, and redirects to root', async () => {
      const { assignTournamentTeams } = await import('@/app/setup/action')

      const fd = new FormData()
      fd.set('numberOfGroups', '3')
      fd.set('removed_10', '1')
      fd.set('player_1', '1')
      fd.set('player_2', '2')
      fd.set('player_3', '3')

      await assignTournamentTeams({ tournamentId: '12' }, fd)

      // Removed players should be set to null, not deleted
      expect(h.tx.player.updateMany).toHaveBeenCalledWith({ where: { id: { in: [10] }, tournamentId: 12 }, data: { groupNumber: null } })
      // Unassigned players (not in assignments) should be cleared as well
      expect(h.tx.player.updateMany).toHaveBeenCalledWith({ where: { tournamentId: 12, id: { notIn: [1, 2, 3] } }, data: { groupNumber: null } })
      // Assigned players should be updated to their group numbers
      expect(h.tx.player.updateMany).toHaveBeenCalledWith({ where: { id: 1, tournamentId: 12 }, data: { groupNumber: 1 } })
      expect(h.tx.player.updateMany).toHaveBeenCalledWith({ where: { id: 2, tournamentId: 12 }, data: { groupNumber: 2 } })
      expect(h.tx.player.updateMany).toHaveBeenCalledWith({ where: { id: 3, tournamentId: 12 }, data: { groupNumber: 3 } })
      expect(h.tx.tournament.update).toHaveBeenCalledWith({ where: { id: 12 }, data: { numberOfGroups: 3, started: true } })
      expect(h.redirect).toHaveBeenCalledWith('/')
    })
  })
})
