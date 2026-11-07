import { defineConfig } from '@playwright/test';

const angular = process.env.SCHEDULER_E2E_FRAMEWORK === 'angular';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
  webServer: {
    command: angular
      ? 'pnpm build:angular && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort'
      : 'pnpm exec vite --mode ts --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !angular && !process.env.CI,
  },
});
