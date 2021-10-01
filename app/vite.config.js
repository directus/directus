import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';
import {
	ensureExtensionDirs,
	getPackageExtensions,
	getLocalExtensions,
	generateExtensionsEntry,
} from '@directus/shared/utils/node';
import { APP_SHARED_DEPS, APP_EXTENSION_TYPES, APP_EXTENSION_PACKAGE_TYPES } from '@directus/shared/constants';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		directusExtensions(),
		vue(),
		yaml({
			transform(data) {
				return data === null ? {} : undefined;
			},
		}),
	],
	resolve: {
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
	},
	base: process.env.NODE_ENV === 'production' ? '' : '/admin/',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://localhost:8055/',
				changeOrigin: true,
			},
		},
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), '/admin/'],
		},
	},
});

function directusExtensions() {
	const prefix = '@directus-extensions-';
	const virtualIds = APP_EXTENSION_TYPES.map((type) => `${prefix}${type}`);

	let extensionEntrys = {};

	return [
		{
			name: 'directus-extensions-serve',
			apply: 'serve',
			config: () => ({
				optimizeDeps: {
					include: APP_SHARED_DEPS,
				},
			}),
			async buildStart() {
				await loadExtensions();
			},
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
		},
		{
			name: 'directus-extensions-build',
			apply: 'build',
			config: () => ({
				build: {
					rollupOptions: {
						input: {
							index: path.resolve(__dirname, 'index.html'),
							...APP_SHARED_DEPS.reduce((acc, dep) => ({ ...acc, [dep.replace(/\//g, '_')]: dep }), {}),
						},
						output: {
							entryFileNames: '[name].[hash].js',
						},
						external: virtualIds,
						preserveEntrySignatures: 'exports-only',
					},
				},
			}),
		},
	];

	async function loadExtensions() {
		const apiPath = path.join('..', 'api');
		const extensionsPath = path.join(apiPath, 'extensions');

		await ensureExtensionDirs(extensionsPath, APP_EXTENSION_TYPES);
		const packageExtensions = await getPackageExtensions(apiPath, APP_EXTENSION_PACKAGE_TYPES);
		const localExtensions = await getLocalExtensions(extensionsPath, APP_EXTENSION_TYPES);

		const extensions = [...packageExtensions, ...localExtensions];

		for (const extensionType of APP_EXTENSION_TYPES) {
			extensionEntrys[extensionType] = generateExtensionsEntry(extensionType, extensions);
		}
	}
}
