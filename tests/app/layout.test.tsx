import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock the global CSS imported by the layout to avoid JSDOM CSS parsing errors
vi.mock('/src/app/globals.css', () => ({}), { virtual: true })
vi.mock('@/app/globals.css', () => ({}), { virtual: true })

describe('RootLayout', () => {
  it('renders header and children', async () => {
    const { default: RootLayout } = await import('@/app/layout')

    render(
      // @ts-expect-error JSX.IntrinsicElements for html/body are not part of JSDOM typings here
      <RootLayout>
        <div data-testid="content">Hello</div>
      </RootLayout>
    )

    // AppHeader contains this text
    expect(screen.getByText(/Tournament Manager/i)).toBeInTheDocument()
    expect(screen.getByTestId('content')).toHaveTextContent('Hello')
  })
})
