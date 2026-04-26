import { defineConfig } from 'vitest/config';

export default defineConfig({
	server: {
		fs: {
			allow: ['..'],
		},
	},
	test: {
		globalSetup: ['./src/__setup__/global.js'],
	},
});
