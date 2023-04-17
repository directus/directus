import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// bump up timeout duration for create & build tests
		testTimeout: 20000,
	},
});
