import { defineConfig } from 'vitest/config';

// Config mínima. La clave `test` la consume Vitest; la lógica de la pecera corre en node.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
