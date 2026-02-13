import "@testing-library/jest-dom";
import React from "react";

// Make React available globally for components compiled expecting global React (classic JSX runtime)
// This avoids "React is not defined" when testing Next.js pages with preserved JSX.
(globalThis as any).React = React;

// Basic mock for next/link to render children directly (no JSX in setup)
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

// Provide a default mock for next/navigation; individual tests can override with vi.mock in-file
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}) as Record<string, string>,
}));

// Mock next/font/google used by RootLayout to avoid runtime font issues in tests
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter" }),
}));

// Polyfill matchMedia used by next-themes
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
