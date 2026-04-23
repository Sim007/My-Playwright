import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
	forbidOnly: !!process.env.CI,
	reporter: 'html',
	webServer: [
		{
			command: 'npx prism mock showcase-contract-testen/scheepsregister/openapi.yaml --port 4010',
			url: 'http://localhost:4010/v1/schepen/244820000',
			reuseExistingServer: true,
			timeout: 15_000,
		},
		{
			command: 'npx prism mock showcase-contract-testen/deelsysteem/openapi.yaml --port 4011',
			url: 'http://localhost:4011/v1/schepen/244820000/lengte-en-positie',
			reuseExistingServer: true,
			timeout: 15_000,
		},
	],
	
	projects: [
		// showcase-simpel
		{
			name: 'showcase-simpel:chromium',
			testDir: path.resolve(__dirname, 'showcase-simpel/tests'),
			timeout: 30 * 1000,
			fullyParallel: true,
			retries: 0,
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'https://playwright.dev',
				trace: 'on-first-retry',
			},
		},

		// showcase-vaarweginformatie
		{
			name: 'showcase-vaarweginformatie:chromium',
			testDir: path.resolve(__dirname, 'showcase-vaarweginformatie/tests'),
			timeout: 5 * 60 * 1000,
			fullyParallel: true,
			retries: 0,
			use: {
				...devices['Desktop Chrome'],
				baseURL: 'https://www.vaarweginformatie.nl',
				trace: 'on-first-retry',
			},
		},

		// showcase-contract-testen
		{
			name: 'showcase-contract-testen:contract-api',
			testDir: path.resolve(__dirname, 'showcase-contract-testen/deelsysteem/contract-tests'),
			timeout: 30 * 1000,
			fullyParallel: true,
			retries: 0,
			use: {
				extraHTTPHeaders: {
					Accept: 'application/json',
				},
				trace: 'on-first-retry',
			},
		},
	],
});