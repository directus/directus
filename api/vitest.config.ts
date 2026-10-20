import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globalSetup: ['./src/__setup__/global.js'],
		include: ['src/**/*.test.ts'],
		coverage: {
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/*.test.ts',
				'src/__setup__/**',
				'src/__utils__/**',
				'src/test-utils/**',
				'src/database/migrations/**',
			],
		},
	},
});
