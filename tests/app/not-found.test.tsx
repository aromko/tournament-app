import { render, screen } from '@testing-library/react'
import React from 'react'
import NotFound from '@/app/not-found'

describe('App not-found page', () => {
  it('renders the not found heading and message', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { level: 2, name: /Not Found/i })).toBeInTheDocument()
    expect(screen.getByText(/Could not find requested resource/i)).toBeInTheDocument()
  })

  it('renders a link to return home', () => {
    render(<NotFound />)

    const link = screen.getByRole('link', { name: /Return Home/i }) as HTMLAnchorElement
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/')
  })
})
