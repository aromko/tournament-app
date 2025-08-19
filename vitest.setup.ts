import '@testing-library/jest-dom'
import React from 'react'

// Basic mock for next/link to render children directly (no JSX in setup)
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    React.createElement('a', { href }, children)
  ),
}))

// Provide a default mock for next/navigation; individual tests can override with vi.mock in-file
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({} as Record<string, string>),
}))
