import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
	forbidOnly: !!process.env.CI,
	reporter: 'html',
	
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
	],
	// Enable discovery of test files in all showcase* folders
	testMatch: '**/showcase-*/tests/**/*.spec.ts',
});