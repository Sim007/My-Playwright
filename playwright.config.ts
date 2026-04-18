import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

type ChildConfig = {
	testDir?: string;
	timeout?: number;
	fullyParallel?: boolean;
	retries?: number;
	use?: Record<string, unknown>;
	projects?: Array<Record<string, unknown>>;
	reporter?: unknown;
	workers?: number;
};

const repoRoot = __dirname;

const showcaseDirs = readdirSync(repoRoot, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.filter(
		(dirName) =>
			existsSync(path.join(repoRoot, dirName, 'playwright.config.ts')) &&
			existsSync(path.join(repoRoot, dirName, 'tests')),
	)
	.sort();

if (showcaseDirs.length === 0) {
	throw new Error(
		'No showcase folders found. Add a subfolder with both playwright.config.ts and tests/.',
	);
}

const showcaseConfigs = showcaseDirs.map((dirName) => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const importedModule = require(path.join(repoRoot, dirName, 'playwright.config'));
	const config = (importedModule.default ?? importedModule) as ChildConfig;

	return {
		dirName,
		config,
	};
});

const primaryConfig = showcaseConfigs[0]?.config;

export default defineConfig({
	forbidOnly: !!process.env.CI,
	reporter: primaryConfig?.reporter ?? 'html',
	workers: primaryConfig?.workers,
	projects: showcaseConfigs.flatMap(({ dirName, config }) => {
		const childProjects = config.projects?.length
			? config.projects
			: [{ name: 'default' }];

		return childProjects.map((project) => ({
			...project,
			name: `${dirName}:${String(project.name ?? 'default')}`,
			testDir: path.join(dirName, config.testDir ?? 'tests'),
			timeout: config.timeout,
			fullyParallel: config.fullyParallel,
			retries: config.retries,
			use: {
				...(config.use ?? {}),
				...((project.use as Record<string, unknown> | undefined) ?? {}),
			},
		}));
	}),
});