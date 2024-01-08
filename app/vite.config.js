import { APP_SHARED_DEPS } from '@directus/extensions';
import {
	generateExtensionsEntrypoint,
	resolveExtensions,
	resolveDependencyExtensions,
} from '@directus/extensions/node';
import yaml from '@rollup/plugin-yaml';
import UnheadVite from '@unhead/addons/vite';
import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

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
		const localExtensions = extensionsPathExists ? await resolveExtensions(EXTENSIONS_PATH) : [];
		const dependencyExtensions = await resolveDependencyExtensions(API_PATH);

		/*
		 * @TODO
		 * These aren't deduplicated, whereas the production ones are. This has seemingly
		 * always been the case. Is this a bug?
		 * @see /api/src/extensions/lib/get-extensions.ts
		 */
		const extensions = [...localExtensions, ...dependencyExtensions];

		// default to enabled for app extension in developer mode
		const extensionSettings = extensions.flatMap((extension) =>
			extension.type === 'bundle'
				? extension.entries.map((entry) => ({ name: `${extension.name}/${entry.name}`, enabled: true }))
				: { name: extension.name, enabled: true },
		);

		extensionsEntrypoint = generateExtensionsEntrypoint(extensions, extensionSettings);
	}
}
