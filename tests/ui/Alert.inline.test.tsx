import { render, screen } from '@testing-library/react'
import React from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert UI component (inline snapshots)', () => {
  it('renders default alert with title and description', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>This is a default alert.</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole('alert')

    // Snapshot a minimal, stable shape via dataset and text content
    expect({
      slot: alert.getAttribute('data-slot'),
      hasTitle: !!container.querySelector('[data-slot="alert-title"]'),
      hasDescription: !!container.querySelector('[data-slot="alert-description"]'),
    }).toMatchInlineSnapshot(`
{
  "hasDescription": true,
  "hasTitle": true,
  "slot": "alert",
}
`)
  })

  it('applies destructive variant styles', () => {
    const { container } = render(
      <Alert variant="destructive">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole('alert')

    // Snapshot minimal variant evidence: class includes text-destructive
    expect({
      slot: alert.getAttribute('data-slot'),
      classIncludesDestructive: alert.className.includes('text-destructive'),
      titleClassIncludesMedium: container
        .querySelector('[data-slot="alert-title"]')!
        .className.includes('font-medium'),
    }).toMatchInlineSnapshot(`
{
  "classIncludesDestructive": true,
  "slot": "alert",
  "titleClassIncludesMedium": true,
}
`)
  })
})
