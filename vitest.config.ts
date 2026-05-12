import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
