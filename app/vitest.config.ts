import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
	plugins: [Vue()],
	test: {
		globals: true,
		environment: 'happy-dom',
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	root: '.', //Define the root
});
