import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    sequence: { concurrent: false },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
      include: [
        "src/app/**/*.{ts,tsx}",
        'src/components/ui/{alert,form,button}.tsx',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/prisma/**',
        '**/*.d.ts',
        'node_modules/**',
        'vitest.setup.ts',
        'vitest.config.ts',
        'next.config.mjs',
        'postcss.config.mjs',
        'eslint.config.mjs',
        'tests/**',
        'src/lib/index.ts',
        // Exclude low-value UI primitives from coverage to focus on tested components
        'src/components/ui/card.tsx',
        'src/components/ui/input.tsx',
        'src/components/ui/label.tsx',
        'src/components/ui/select.tsx',
        'src/components/ui/dropdown-menu.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
