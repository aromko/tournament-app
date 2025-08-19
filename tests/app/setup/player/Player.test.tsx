import { render, screen } from '@testing-library/react'
import React from 'react'
import Player from '@/app/setup/player/[id]/Player'

describe('Player input component', () => {
  it('renders label, required input with correct id/name and defaultValue', () => {
    render(<Player index={'0'} defaultValue={'Alice'} />)

    const input = screen.getByLabelText(/player 1/i) as HTMLInputElement
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('id', 'player_0')
    expect(input).toHaveAttribute('name', 'player_0')
    expect(input.value).toBe('Alice')
  })
})
