import { databases } from '@directus/sandbox';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		teardownTimeout: 60_000,
		include: [],
		globalSetup: './setup/setup-all.ts',
		projects: [
			'./vitest.config.ts',
			...databases.map((database, index) => ({
				test: {
					setupFiles: './setup/setup.ts',
					globalSetup: './setup/setup-one.ts',
					name: database,
					testTimeout: 10_000,
					reporters: ['verbose'],
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
