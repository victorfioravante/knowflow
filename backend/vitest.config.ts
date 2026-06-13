import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Roda apenas os testes em TypeScript do src — nunca o output compilado em dist,
    // cujos arquivos usam require() e quebram o Vitest.
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
})
