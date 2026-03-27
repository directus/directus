import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		globalSetup: ['./src/__setup__/global.js'],
	},
});
