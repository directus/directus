import { generateExtensionsEntrypoint } from './generate-extensions-entrypoint.js';
import type { Extension, ExtensionSettings } from '../../shared/types/index.js';
import { describe, expect, it } from 'vitest';

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
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [];"`,
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
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [];"`,
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

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import panel0 from './extensions/panel/index.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [panel0];export const themes = [];export const operations = [];"`,
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

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import operation0 from './extensions/operation/app.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [operation0];"`,
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

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import {interfaces as interfaceBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [...interfaceBundle0];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [...operationBundle0];"`,
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

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import display0 from './extensions/display/index.js';import operation0 from './extensions/operation/app.js';import {layouts as layoutBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [];export const displays = [display0];export const layouts = [...layoutBundle0];export const modules = [];export const panels = [];export const themes = [];export const operations = [operation0,...operationBundle0];"`,
		);
	});
});
