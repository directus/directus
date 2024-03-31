import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		typecheck: {
			only: true,
			enabled: true,
			include: ['tests/**/*.test.ts'],
		},
		watch: false,
	},
});
