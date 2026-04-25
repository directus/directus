import { type Database, databases, type Env, type Options } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

declare module 'vitest' {
	interface Matchers {
		toMatchFile: (file: string) => Promise<void>;
	}

	export interface ProvidedContext {
		envs: Record<Database, Env>;
		port: Record<Database, number>;
		options: Record<Database, DeepPartial<Options>>;
	}
}

// mark this file as a module so augmentation works correctly
export {};

export default defineConfig({
	plugins: [tsconfigPaths() as any],
	test: {
		teardownTimeout: 60_000,
		include: [],
		globalSetup: './setup/global-setup-all.ts',
		passWithNoTests: true,
		exclude: [...configDefaults.exclude, '**/*.sb.test.ts'],
		projects: [
			'./vitest.config.ts',
			...databases.flatMap((database, index) => {
				return [
					{
						plugins: [tsconfigPaths() as any],
						test: {
							setupFiles: './setup/setup-files.ts',
							globalSetup: './setup/global-setup-one.ts',
							name: database,
							passWithNoTests: true,
							exclude: [...configDefaults.exclude, '**/*.sb.test.ts'],
							testTimeout: 20_000,
							reporters: ['verbose'],
							env: {
								DATABASE: database,
								PORT: String(8000 + index * 100),
								...process.env,
							},
							sequence: {
								groupOrder: 0,
							},
						},
					},
					{
						plugins: [tsconfigPaths() as any],
						test: {
							setupFiles: './setup/setup-files.ts',
							name: `${database}-sb`,
							silent: false,
							passWithNoTests: true,
							include: ['**/*.sb.test.ts'],
							testTimeout: 100_000,
							hookTimeout: 100_000,
							reporters: ['verbose'],
							fileParallelism: false,
							env: {
								DATABASE: database,
								PORT: String(8050 + index * 100),
								...process.env,
							},
							sequence: {
								groupOrder: 1 + index,
							},
						},
					},
				];
			}),
		],
	},
});
