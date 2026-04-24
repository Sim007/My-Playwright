import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const projectArgValues = process.argv
	.filter((arg) => arg.startsWith('--project='))
	.map((arg) => arg.slice('--project='.length));

const hasProjectFilter = projectArgValues.length > 0;
const needsContractMocks =
	!hasProjectFilter || projectArgValues.some((value) => value.includes('showcase-contract-testen'));

export default defineConfig({
	forbidOnly: !!process.env.CI,
	reporter: [
		['html'],
		[
			'./showcase-contract-testen/scripts/readable-reporter.js',
			{
				baseDir: path.resolve(__dirname, 'showcase-contract-testen'),
				onlyPath: 'deelsysteem/contract-tests',
				outputFile: 'test-results/contract-report.txt',
			},
		],
	],
	webServer: needsContractMocks
		? [
				{
					command: 'npm --workspace showcase-contract-testen run mock:scheepsregister',
					url: 'http://localhost:4010/v1/schepen/244820000',
					reuseExistingServer: true,
					timeout: 60_000,
				},
				{
					command: 'npm --workspace showcase-contract-testen run mock:deelsysteem',
					url: 'http://localhost:4011/v1/schepen/244820000/lengte-en-positie',
					reuseExistingServer: true,
					timeout: 60_000,
				},
			]
		: undefined,
	
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

		// showcase-rapport-allure3
		{
			name: 'allure3:chromium',
			testDir: path.resolve(__dirname, 'showcase-rapport-allure3/tests'),
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