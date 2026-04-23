import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'deelsysteem/contract-tests',
  reporter: [['line']],
  webServer: [
    {
      command: 'npx prism mock scheepsregister/openapi.yaml --port 4010',
      url: 'http://localhost:4010/v1/schepen/244820000',
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'npx prism mock deelsysteem/openapi.yaml --port 4011',
      url: 'http://localhost:4011/v1/schepen/244820000/lengte-en-positie',
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
  projects: [
    {
      name: 'contract-api',
      // Geen browser nodig — puur HTTP/REST contract tests via request fixture
    },
  ],
  use: {
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

});
