import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';
import { getPackageExtensions, getLocalExtensions, generateExtensionsEntry } from '@directus/shared/utils';
import { APP_EXTENSION_TYPES } from '@directus/shared/constants';

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
	const prefix = '@directus-extensions-';
	const virtualIds = APP_EXTENSION_TYPES.map((type) => `${prefix}${type}`);

	let extensionEntrys = {};
	loadExtensions();

	return {
		name: 'directus-extension',
		resolveId(id) {
			if (virtualIds.includes(id)) {
				return id;
			}
		},
		load(id) {
			if (virtualIds.includes(id)) {
				const extensionType = id.substring(prefix.length);

				return extensionEntrys[extensionType];
			}
		},
	};

	async function loadExtensions() {
		const packageExtensions = await getPackageExtensions(path.join('..', 'api'));
		const localExtensions = await getLocalExtensions(path.join('..', 'api', 'extensions'));

		const extensions = [...packageExtensions, ...localExtensions];

		for (const extensionType of APP_EXTENSION_TYPES) {
			extensionEntrys[extensionType] = generateExtensionsEntry(extensionType, extensions);
		}
	}
}
