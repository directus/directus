import { APP_SHARED_DEPS } from '@directus/extensions';
import { generateExtensionsEntrypoint, resolveFsExtensions, resolveModuleExtensions } from '@directus/extensions/node';
import yaml from '@rollup/plugin-yaml';
import UnheadVite from '@unhead/addons/vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';
import vueDevtools from 'vite-plugin-vue-devtools';

const API_PATH = path.join('..', 'api');

/*
 * @TODO This extension path is hardcoded to the env default (./extensions). This won't work
 * as expected when extensions are read from a different location locally through the
 * EXTENSIONS_LOCATION env var
 */
const EXTENSIONS_PATH = path.join(API_PATH, 'extensions');

const extensionsPathExists = fs.existsSync(EXTENSIONS_PATH);

// https://vitejs.dev/config/
export default defineConfig({
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			},
		},
	},
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
		vueDevtools(),
	],
	define: {
		__VUE_I18N_LEGACY_API__: false,
	},
	resolve: {
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
	},
	base: process.env.NODE_ENV === 'production' ? '' : '/admin',
	...(!process.env.HISTOIRE && {
		server: {
			port: 8080,
			proxy: {
				'^/(?!admin)': {
					target: process.env.API_URL ? process.env.API_URL : 'http://127.0.0.1:8055/',
				},
				'/websocket/logs': {
					target: process.env.API_URL ? process.env.API_URL : 'ws://127.0.0.1:8055/',
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
		deps: {
			optimizer: {
				web: {
					exclude: ['pinia', 'url'],
				},
			},
		},
	},
});

function getExtensionsRealPaths() {
	return extensionsPathExists
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
		const localExtensions = extensionsPathExists ? await resolveFsExtensions(EXTENSIONS_PATH) : new Map();
		const moduleExtensions = await resolveModuleExtensions(API_PATH);

		const registryExtensions = extensionsPathExists
			? await resolveFsExtensions(path.join(EXTENSIONS_PATH, '.registry'))
			: new Map();

		const mockSetting = (source, folder, extension) => {
			const settings = [
				{
					id: extension.name,
					enabled: true,
					folder: folder,
					bundle: null,
					source: source,
				},
			];

			if (extension.type === 'bundle') {
				settings.push(
					...extension.entries.map((entry) => ({
						enabled: true,
						folder: entry.name,
						bundle: extension.name,
						source: source,
					})),
				);
			}

			return settings;
		};

		// default to enabled for app extension in developer mode
		const extensionSettings = [
			...Array.from(localExtensions.entries()).flatMap(([folder, extension]) =>
				mockSetting('local', folder, extension),
			),
			...Array.from(moduleExtensions.entries()).flatMap(([folder, extension]) =>
				mockSetting('module', folder, extension),
			),
			...Array.from(registryExtensions.entries()).flatMap(([folder, extension]) =>
				mockSetting('registry', folder, extension),
			),
		];

		extensionsEntrypoint = generateExtensionsEntrypoint(
			{ module: moduleExtensions, local: localExtensions, registry: registryExtensions },
			extensionSettings,
		);
	}
}
