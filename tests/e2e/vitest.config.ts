import { Database, databases, Env, Options } from '@directus/sandbox';
import { defineConfig } from 'vitest/config';
import { DeepPartial } from '@directus/types';

declare module 'vitest' {
	interface Matchers {
		toMatchFile: (file: string) => Promise<void>;
	}

	export interface ProvidedContext {
		envs: Record<Database, Env>;
		options: Record<Database, DeepPartial<Options>>;
	}
}

// mark this file as a module so augmentation works correctly
export {};

export default defineConfig({
	test: {
		teardownTimeout: 60_000,
		include: [],
		globalSetup: './setup/global-setup-all.ts',
		passWithNoTests: true,
		projects: [
			'./vitest.config.ts',
			...databases.map((database, index) => ({
				test: {
					setupFiles: './setup/setup-files.ts',
					globalSetup: './setup/global-setup-one.ts',
					name: database,
					passWithNoTests: true,
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
