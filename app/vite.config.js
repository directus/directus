import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		directusExtension(),
		vue(),
		yaml({
			transform(data) {
				return data === null ? {} : undefined;
			},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '/src'),
		},
	},
	base: process.env.NODE_ENV === 'development' ? '/admin/' : '',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://localhost:8055/',
				changeOrigin: true,
			},
		},
	},
	build: {
		rollupOptions: {
			input: {
				index: path.resolve(__dirname, 'index.html'),
				vue: 'vue',
			},
			output: {
				entryFileNames: '[name].[hash].js',
			},
			preserveEntrySignatures: 'exports-only',
		},
	},
});

function directusExtension() {
	const virtualIds = [
		'@directus-extension-interfaces',
		'@directus-extension-displays',
		'@directus-extension-layouts',
		'@directus-extension-modules',
	];

	return {
		name: 'directus-extension',
		resolveId(id) {
			if (virtualIds.includes(id)) {
				return id;
			}
		},
		load(id) {
			if (virtualIds.includes(id)) {
				return 'export default []';
			}
		},
	};
}
