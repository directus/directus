import { defineConfig } from 'vitest/config';

/// <reference types="vitest" />
export default defineConfig({
	test: {
		globals: false,
		environment: 'node',
		reporters: 'verbose',
	},
});
