import { render } from '@testing-library/react'
import React from 'react'
import { Input } from '@/components/ui/input'

describe('Input UI primitive (smoke)', () => {
  it('renders with type and class', () => {
    const { container } = render(<Input type="text" placeholder="Name" className="extra" />)
    const input = container.querySelector('input')!
    expect(input).toBeInTheDocument()
    expect(input.className).toContain('extra')
    expect(input.getAttribute('type')).toBe('text')
  })
})
