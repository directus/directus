import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import type { Extension, ExtensionSettings } from '../../shared/types/index.js';
import { generateExtensionsEntrypoint, LOAD_HELPER } from './generate-extensions-entrypoint.js';

// every non-empty entrypoint starts with the same helper, so the snapshots only hold what differs
function afterLoadHelper(entrypoint: string): string {
	expect(entrypoint.startsWith(LOAD_HELPER)).toBe(true);
	return entrypoint.slice(LOAD_HELPER.length);
}

describe('generateExtensionsEntrypoint', () => {
	it('returns an empty extension entrypoint if there is no App, Hybrid or Bundle extension', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-bundle0-extension', {
			path: './extensions/bundle',
			name: 'mock-bundle0-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [],
			host: '^10.0.0',
			local: false,
			partial: false,
		});

		const mockSettings: ExtensionSettings[] = [
			{ id: 'x', folder: 'mock-bundle0-extension', enabled: true, source: 'local', bundle: null },
		];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [];export const operations = [];"`,
		);
	});

	it('returns an empty extension entrypoint if there are no enabled extensions', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-display-extension', {
			path: './extensions/display',
			name: 'mock-display-extension',
			type: 'display',
			entrypoint: 'index.js',
			local: true,
		});

		mockExtensions.local.set('mock-operation-extension', {
			path: './extensions/operation',
			name: 'mock-operation-extension',
			type: 'operation',
			entrypoint: { app: 'app.js', api: 'api.js' },
			local: true,
		});

		mockExtensions.local.set('mock-bundle0-extension', {
			path: './extensions/bundle',
			name: 'mock-bundle0-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [
				{ type: 'layout', name: 'mock-bundle-layout' },
				{ type: 'operation', name: 'mock-bundle-operation' },
				{ type: 'hook', name: 'mock-bundle-hook' },
			],
			host: '^10.0.0',
			local: false,
			partial: false,
		});

		mockExtensions.local.set('mock-bundle-no-app-extension', {
			path: './extensions/bundle-no-app',
			name: 'mock-bundle-no-app-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [{ type: 'endpoint', name: 'mock-bundle-no-app-endpoint' }],
			host: '^10.0.0',
			local: false,
			partial: true,
		});

		const mockSettings = [
			{ folder: 'mock-display-extension', enabled: false },
			{ folder: 'mock-operation-extension', enabled: false },
			{ folder: 'mock-bundle0-extension/mock-bundle-layout', enabled: false },
			{ folder: 'mock-bundle0-extension/mock-bundle-operation', enabled: false },
			{ folder: 'mock-bundle0-extension/mock-bundle-hook', enabled: false },
			{ folder: 'mock-bundle-no-app-extension/mock-bundle-no-app-endpoint', enabled: false },
		] as ExtensionSettings[];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [];export const operations = [];"`,
		);
	});

	it('returns an extension entrypoint exporting a single App extension', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-panel-extension', {
			path: './extensions/panel',
			name: 'mock-panel-extension',
			type: 'panel',
			entrypoint: 'index.js',
			local: true,
		});

		const mockSettings = [{ source: 'local', folder: 'mock-panel-extension', enabled: true }] as ExtensionSettings[];

		expect(afterLoadHelper(generateExtensionsEntrypoint(mockExtensions, mockSettings))).toMatchInlineSnapshot(
			`"const [panel0] = await Promise.all([load("mock-panel-extension", () => import('./extensions/panel/index.js'))]);export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [panel0?.default].filter(Boolean);export const themes = [];export const richtexts = [];export const operations = [];"`,
		);
	});

	it('imports an enabled richtext extension and drops a disabled one', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-callout-extension', {
			path: './extensions/callout',
			name: 'mock-callout-extension',
			type: 'richtext',
			entrypoint: 'index.js',
			local: true,
		});

		mockExtensions.local.set('mock-kbd-extension', {
			path: './extensions/kbd',
			name: 'mock-kbd-extension',
			type: 'richtext',
			entrypoint: 'index.js',
			local: true,
		});

		const mockSettings = [
			{ source: 'local', folder: 'mock-callout-extension', enabled: true },
			{ source: 'local', folder: 'mock-kbd-extension', enabled: false },
		] as ExtensionSettings[];

		expect(afterLoadHelper(generateExtensionsEntrypoint(mockExtensions, mockSettings))).toMatchInlineSnapshot(
			`"const [richtext0] = await Promise.all([load("mock-callout-extension", () => import('./extensions/callout/index.js'))]);export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [richtext0?.default].filter(Boolean);export const operations = [];"`,
		);
	});

	it('returns an extension entrypoint exporting a single Hybrid extension', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-operation-extension', {
			path: './extensions/operation',
			name: 'mock-operation-extension',
			type: 'operation',
			entrypoint: { app: 'app.js', api: 'api.js' },
			local: true,
		});

		const mockSettings = [
			{ source: 'local', folder: 'mock-operation-extension', enabled: true },
		] as ExtensionSettings[];

		expect(afterLoadHelper(generateExtensionsEntrypoint(mockExtensions, mockSettings))).toMatchInlineSnapshot(
			`"const [operation0] = await Promise.all([load("mock-operation-extension", () => import('./extensions/operation/app.js'))]);export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [];export const operations = [operation0?.default].filter(Boolean);"`,
		);
	});

	it('returns an extension entrypoint exporting from a single Bundle extension', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-bundle-extension', {
			path: './extensions/bundle',
			name: 'mock-bundle-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [
				{ type: 'interface', name: 'mock-bundle-interface' },
				{ type: 'operation', name: 'mock-bundle-operation' },
				{ type: 'hook', name: 'mock-bundle-hook' },
			],
			host: '^10.0.0',
			local: false,
			partial: true,
		});

		const mockSettings = [
			{ id: 'mock-bundle-id', source: 'local', folder: 'mock-bundle-extension', enabled: true },
			{
				id: 'mock-bundle-interface-id',
				source: 'local',
				folder: 'mock-bundle-interface',
				enabled: true,
				bundle: 'mock-bundle-id',
			},
			{
				id: 'mock-bundle-operation-id',
				source: 'local',
				folder: 'mock-bundle-operation',
				enabled: true,
				bundle: 'mock-bundle-id',
			},
			{
				id: 'mock-bundle-hook-id',
				source: 'local',
				folder: 'mock-bundle-hook',
				enabled: true,
				bundle: 'mock-bundle-id',
			},
		] as ExtensionSettings[];

		expect(afterLoadHelper(generateExtensionsEntrypoint(mockExtensions, mockSettings))).toMatchInlineSnapshot(
			`"const [bundle0] = await Promise.all([load("mock-bundle-extension", () => import('./extensions/bundle/app.js'))]);export const interfaces = [...(bundle0?.interfaces ?? [])];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [];export const operations = [...(bundle0?.operations ?? [])];"`,
		);
	});

	it('returns an extension entrypoint exporting multiple extensions', () => {
		const mockExtensions: {
			module: Map<string, Extension>;
			registry: Map<string, Extension>;
			local: Map<string, Extension>;
		} = {
			module: new Map(),
			registry: new Map(),
			local: new Map(),
		};

		mockExtensions.local.set('mock-display-extension', {
			path: './extensions/display',
			name: 'mock-display-extension',
			type: 'display',
			entrypoint: 'index.js',
			local: true,
		});

		mockExtensions.local.set('mock-operation-extension', {
			path: './extensions/operation',
			name: 'mock-operation-extension',
			type: 'operation',
			entrypoint: { app: 'app.js', api: 'api.js' },
			local: true,
		});

		mockExtensions.local.set('mock-bundle0-extension', {
			path: './extensions/bundle',
			name: 'mock-bundle0-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [
				{ type: 'layout', name: 'mock-bundle-layout' },
				{ type: 'operation', name: 'mock-bundle-operation' },
				{ type: 'hook', name: 'mock-bundle-hook' },
			],
			host: '^10.0.0',
			local: false,
			partial: true,
		});

		mockExtensions.local.set('mock-bundle-no-app-extension', {
			path: './extensions/bundle-no-app',
			name: 'mock-bundle-no-app-extension',
			version: '1.0.0',
			type: 'bundle',
			entrypoint: { app: 'app.js', api: 'api.js' },
			entries: [{ type: 'endpoint', name: 'mock-bundle-no-app-endpoint' }],
			host: '^10.0.0',
			local: false,
			partial: true,
		});

		const mockSettings: ExtensionSettings[] = [
			{
				id: 'mock-display-extension-id',
				folder: 'mock-display-extension',
				enabled: true,
				source: 'local',
				bundle: null,
			},
			{
				id: 'mock-operation-extension-id',
				folder: 'mock-operation-extension',
				enabled: true,
				source: 'local',
				bundle: null,
			},
			{ id: 'mock-bundle-id', folder: 'mock-bundle0-extension', enabled: true, source: 'local', bundle: null },
			{
				id: 'mock-bundle-layout-id',
				folder: 'mock-bundle-layout',
				enabled: true,
				source: 'local',
				bundle: 'mock-bundle-id',
			},
			{
				id: 'mock-bundle-operation-id',
				folder: 'mock-bundle-operation',
				enabled: true,
				source: 'local',
				bundle: 'mock-bundle-id',
			},
			{
				id: 'mock-bundle-hook-id',
				folder: 'mock-bundle-hook',
				enabled: true,
				source: 'local',
				bundle: 'mock-bundle-id',
			},
			{
				id: 'mock-bundle-no-app-endpoint-id',
				folder: 'mock-bundle-no-app-endpoint',
				enabled: true,
				source: 'local',
				bundle: null,
			},
		];

		expect(afterLoadHelper(generateExtensionsEntrypoint(mockExtensions, mockSettings))).toMatchInlineSnapshot(
			`"const [display0,operation0,bundle0] = await Promise.all([load("mock-display-extension", () => import('./extensions/display/index.js')),load("mock-operation-extension", () => import('./extensions/operation/app.js')),load("mock-bundle0-extension", () => import('./extensions/bundle/app.js'))]);export const interfaces = [];export const displays = [display0?.default].filter(Boolean);export const layouts = [...(bundle0?.layouts ?? [])];export const modules = [];export const panels = [];export const themes = [];export const richtexts = [];export const operations = [operation0?.default,...(bundle0?.operations ?? [])].filter(Boolean);"`,
		);
	});
});

describe('generateExtensionsEntrypoint load isolation', () => {
	let dir: string;
	let error: MockInstance<typeof console.error>;

	beforeEach(async () => {
		dir = await mkdtemp(path.join(tmpdir(), 'directus-entrypoint-'));
		error = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await rm(dir, { recursive: true, force: true });
	});

	async function writeExtension(folder: string, file: string, source: string) {
		await mkdir(path.join(dir, folder), { recursive: true });
		await writeFile(path.join(dir, folder, file), source);
	}

	async function importEntrypoint(entrypoint: string) {
		const file = path.join(dir, 'entry.mjs');
		await writeFile(file, entrypoint);
		return await import(pathToFileURL(file).href);
	}

	function extension(folder: string): Extension {
		return { path: `./${folder}`, name: folder, type: 'panel', entrypoint: 'index.js', local: true };
	}

	it('skips an extension whose module throws at load and still exports the others', async () => {
		await writeExtension('ext-a', 'index.js', `export default { id: 'a' };`);
		await writeExtension('ext-b', 'index.js', `throw new Error('ext-b throws at load');`);
		await writeExtension('ext-c', 'index.js', `export default { id: 'c' };`);

		const extensions = { module: new Map(), registry: new Map(), local: new Map<string, Extension>() };
		extensions.local.set('ext-a', extension('ext-a'));
		extensions.local.set('ext-b', extension('ext-b'));
		extensions.local.set('ext-c', extension('ext-c'));

		const settings = ['ext-a', 'ext-b', 'ext-c'].map((folder) => ({
			source: 'local',
			folder,
			enabled: true,
		})) as ExtensionSettings[];

		const loaded = await importEntrypoint(generateExtensionsEntrypoint(extensions, settings));

		expect(loaded.panels).toEqual([{ id: 'a' }, { id: 'c' }]);
		expect(error).toHaveBeenCalledTimes(1);
		expect(error.mock.calls[0]?.[0]).toContain('ext-b');
	});

	it('drops the entries of a bundle whose module throws at load and keeps a healthy bundle', async () => {
		await writeExtension('bundle-a', 'app.js', `export const panels = [{ id: 'a' }];`);
		await writeExtension('bundle-b', 'app.js', `throw new Error('bundle-b throws at load');`);

		const extensions = { module: new Map(), registry: new Map(), local: new Map<string, Extension>() };

		for (const folder of ['bundle-a', 'bundle-b']) {
			extensions.local.set(folder, {
				path: `./${folder}`,
				name: folder,
				version: '1.0.0',
				type: 'bundle',
				entrypoint: { app: 'app.js', api: 'api.js' },
				entries: [{ type: 'panel', name: `${folder}-panel` }],
				host: '^10.0.0',
				local: true,
				partial: false,
			});
		}

		const settings = ['bundle-a', 'bundle-b'].flatMap((folder) => [
			{ id: folder, source: 'local', folder, enabled: true, bundle: null },
			{ id: `${folder}-panel`, source: 'local', folder: `${folder}-panel`, enabled: true, bundle: folder },
		]) as ExtensionSettings[];

		const loaded = await importEntrypoint(generateExtensionsEntrypoint(extensions, settings));

		expect(loaded.panels).toEqual([{ id: 'a' }]);
		expect(error).toHaveBeenCalledTimes(1);
		expect(error.mock.calls[0]?.[0]).toContain('bundle-b');
	});
});
