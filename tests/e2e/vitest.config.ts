import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: [],
		globalSetup: './setup-all.ts',
		projects: [
			'./vitest.config.ts',
			...['maria', 'cockroachdb', 'mssql', 'mysql', 'oracle', 'postgres', 'sqlite'].map((database, index) => ({
				test: {
					globalSetup: './setup.ts',
					name: database,
					testTimeout: 10_000,
					env: {
						DATABASE: database,
						PORT: String(8000 + index * 100),
						...process.env,
					},
				},
			})),
		],
	},
});
