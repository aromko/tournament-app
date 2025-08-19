import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock the global CSS imported by the layout to avoid JSDOM CSS parsing errors
vi.mock('/src/app/globals.css', () => ({}))
vi.mock('@/app/globals.css', () => ({}))

describe('RootLayout', () => {
  it('renders header and children', async () => {
    const { default: RootLayout } = await import('@/app/layout')

    render(
      <RootLayout>
        <div data-testid="content">Hello</div>
      </RootLayout>
    )

    // AppHeader contains this text
    expect(screen.getByText(/Tournament Manager/i)).toBeInTheDocument()
    expect(screen.getByTestId('content')).toHaveTextContent('Hello')
  })
})
