import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globalSetup: ['./src/__setup__/global.js'],
	},
});
