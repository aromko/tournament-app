import { describe, it, expect } from 'vitest'
import React, { useState } from 'react'
import { render, act } from '@testing-library/react'
import { useHandleDragEnd, type ContainersState } from '@/hooks/useHandleDragEnd'

function Trigger({ onReady }: { onReady: (fire: (activeId: string, overId: string | null) => void, getState: () => ContainersState) => void }) {
  const [state, setState] = useState<ContainersState>({
    unassigned: [],
    'group-1': ['p1'],
    'group-2': [],
  })
  const handler = useHandleDragEnd(state, setState)

  React.useEffect(() => {
    onReady((activeId, overId) => {
      // simulate dnd-kit DragEndEvent shape minimally
      // @ts-expect-error partial
      handler({ active: { id: activeId }, over: overId ? { id: overId } : null })
    }, () => state)
    // effect to expose handler and current state for testing
  }, [handler, state])

  return null
}

describe('useHandleDragEnd', () => {
  it('does nothing for identity move (Arrange-Act-Assert)', () => {
    // Arrange
    let fire!: (activeId: string, overId: string | null) => void
    let getState!: () => ContainersState
    render(<Trigger onReady={(f, g) => { fire = f; getState = g }} />)

    // Act
    act(() => fire('p1', 'group-1'))

    // Assert
    expect(getState()['group-1']).toEqual(['p1'])
    expect(getState()['group-2']).toEqual([])
  })

  it('moves player between groups (Arrange-Act-Assert)', () => {
    // Arrange
    let fire!: (activeId: string, overId: string | null) => void
    let getState!: () => ContainersState
    render(<Trigger onReady={(f, g) => { fire = f; getState = g }} />)

    // Act
    act(() => fire('p1', 'group-2'))

    // Assert
    expect(getState()['group-1']).toEqual([])
    expect(getState()['group-2']).toEqual(['p1'])
  })

  it('ignores when over is missing (Arrange-Act-Assert)', () => {
    // Arrange
    let fire!: (activeId: string, overId: string | null) => void
    let getState!: () => ContainersState
    render(<Trigger onReady={(f, g) => { fire = f; getState = g }} />)

    // Act
    act(() => fire('p1', null))

    // Assert
    expect(getState()['group-1']).toEqual(['p1'])
    expect(getState()['group-2']).toEqual([])
  })
})
