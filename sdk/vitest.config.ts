import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		typecheck: {
			only: true,
			enabled: true,
		},
		watch: false,
	},
});
