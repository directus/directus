import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), yaml()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '/src'),
		},
	},
	base: '/admin/',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://localhost:8055/',
				changeOrigin: true,
			},
		},
	},
});
