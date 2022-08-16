import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	optimizeDeps: {
		exclude: ['@directus/docs'],
	},
	resolve: {
		alias: [
			{ find: '@', replacement: path.resolve(__dirname, 'src') },
			{ find: 'json2csv', replacement: 'json2csv/dist/json2csv.umd.js' },
		],
	},
	test: {
		environment: 'happy-dom',
		coverage: {
			all: true,
			include: ['src/**/*.{js,vue}'],
		},
	},
});
