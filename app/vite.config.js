import {
	APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES,
	APP_OR_HYBRID_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	NESTED_EXTENSION_TYPES,
} from '@directus/extensions';
import {
	ensureExtensionDirs,
	generateExtensionsEntrypoint,
	getLocalExtensions,
	getPackageExtensions,
	resolvePackageExtensions,
} from '@directus/extensions/node';
import yaml from '@rollup/plugin-yaml';
import UnheadVite from '@unhead/addons/vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

const API_PATH = path.join('..', 'api');
const EXTENSIONS_PATH = path.join(API_PATH, 'extensions');

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		directusExtensions(),
		vue(),
		UnheadVite(),
		yaml({
			transform(data) {
				return data === null ? {} : undefined;
			},
		}),
		{
			name: 'watch-directus-dependencies',
			configureServer: (server) => {
				server.watcher.options = {
					...server.watcher.options,
					ignored: [/node_modules\/(?!@directus\/).*/, '**/.git/**'],
				};
			},
		},
	],
	resolve: {
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
	},
	base: process.env.NODE_ENV === 'production' ? '' : '/admin/',
	...(!process.env.HISTOIRE && {
		server: {
			port: 8080,
			proxy: {
				'^/(?!admin)': {
					target: process.env.API_URL ? process.env.API_URL : 'http://127.0.0.1:8055/',
					changeOrigin: true,
				},
			},
			fs: {
				allow: [searchForWorkspaceRoot(process.cwd()), ...getExtensionsRealPaths()],
			},
		},
	}),
	test: {
		environment: 'happy-dom',
		setupFiles: ['src/__setup__/mock-globals.ts'],
		// See https://github.com/vitest-dev/vitest/issues/4074#issuecomment-1787934252
		deps: {
			optimizer: {
				web: {
					enabled: false,
				},
			},
		},
	},
});

function getExtensionsRealPaths() {
	return fs.existsSync(EXTENSIONS_PATH)
		? fs
				.readdirSync(EXTENSIONS_PATH)
				.flatMap((typeDir) => {
					const extensionTypeDir = path.join(EXTENSIONS_PATH, typeDir);
					if (!fs.statSync(extensionTypeDir).isDirectory()) return;
					return fs.readdirSync(extensionTypeDir).map((dir) => fs.realpathSync(path.join(extensionTypeDir, dir)));
				})
				.filter((v) => v)
		: [];
}

function directusExtensions() {
	const virtualExtensionsId = '@directus-extensions';

	let extensionsEntrypoint = null;

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
				if (id === virtualExtensionsId) {
					return id;
				}
			},
			load(id) {
				if (id === virtualExtensionsId) {
					return extensionsEntrypoint;
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
							entryFileNames: 'assets/[name].[hash].entry.js',
						},
						external: [virtualExtensionsId],
						preserveEntrySignatures: 'exports-only',
					},
				},
			}),
		},
	];

	async function loadExtensions() {
		await ensureExtensionDirs(EXTENSIONS_PATH, NESTED_EXTENSION_TYPES);
		const packageExtensions = await getPackageExtensions(API_PATH, APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES);
		const localPackageExtensions = await resolvePackageExtensions(EXTENSIONS_PATH);
		const localExtensions = await getLocalExtensions(EXTENSIONS_PATH, APP_OR_HYBRID_EXTENSION_TYPES);

		const extensions = [...packageExtensions, ...localPackageExtensions, ...localExtensions];

		// default to enabled for app extension in developer mode
		const extensionSettings = extensions.flatMap((extension) =>
			extension.type === 'bundle'
				? extension.entries.map((entry) => ({ name: `${extension.name}/${entry.name}`, enabled: true }))
				: { name: extension.name, enabled: true },
		);

		extensionsEntrypoint = generateExtensionsEntrypoint(extensions, extensionSettings);
	}
}
