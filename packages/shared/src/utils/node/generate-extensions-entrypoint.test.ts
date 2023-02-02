import { describe, expect, it } from 'vitest';

import { Extension } from '../../types/extensions';
import { generateExtensionsEntrypoint } from './generate-extensions-entrypoint';

describe('generateExtensionsEntrypoint', () => {
	it('returns an empty extension entrypoint if there is no App, Hybrid or Bundle extension', () => {
		const mockExtensions: Extension[] = [
			{
				path: './extensions/bundle',
				name: 'mock-bundle0-extension',
				version: '1.0.0',
				type: 'bundle',
				entrypoint: { app: 'app.js', api: 'api.js' },
				entries: [],
				host: '^9.0.0',
				local: false,
			},
		];

		expect(generateExtensionsEntrypoint(mockExtensions)).toBe(
			`export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const operations = [];`
		);
	});

	it('returns an extension entrypoint exporting a single App extension', () => {
		const mockExtensions: Extension[] = [
			{ path: './extensions/panel', name: 'mock-panel-extension', type: 'panel', entrypoint: 'index.js', local: true },
		];

		expect(generateExtensionsEntrypoint(mockExtensions)).toBe(
			`import panel0 from './extensions/panel/index.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [panel0];export const operations = [];`
		);
	});

	it('returns an extension entrypoint exporting a single Hybrid extension', () => {
		const mockExtensions: Extension[] = [
			{
				path: './extensions/operation',
				name: 'mock-operation-extension',
				type: 'operation',
				entrypoint: { app: 'app.js', api: 'api.js' },
				local: true,
			},
		];

		expect(generateExtensionsEntrypoint(mockExtensions)).toBe(
			`import operation0 from './extensions/operation/app.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const operations = [operation0];`
		);
	});

	it('returns an extension entrypoint exporting from a single Bundle extension', () => {
		const mockExtensions: Extension[] = [
			{
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
				host: '^9.0.0',
				local: false,
			},
		];

		expect(generateExtensionsEntrypoint(mockExtensions)).toBe(
			`import {interfaces as interfaceBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [...interfaceBundle0];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const operations = [...operationBundle0];`
		);
	});

	it('returns an extension entrypoint exporting multiple extensions', () => {
		const mockExtensions: Extension[] = [
			{
				path: './extensions/display',
				name: 'mock-display-extension',
				type: 'display',
				entrypoint: 'index.js',
				local: true,
			},
			{
				path: './extensions/operation',
				name: 'mock-operation-extension',
				type: 'operation',
				entrypoint: { app: 'app.js', api: 'api.js' },
				local: true,
			},
			{
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
				host: '^9.0.0',
				local: false,
			},
			{
				path: './extensions/bundle-no-app',
				name: 'mock-bundle-no-app-extension',
				version: '1.0.0',
				type: 'bundle',
				entrypoint: { app: 'app.js', api: 'api.js' },
				entries: [{ type: 'endpoint', name: 'mock-bundle-no-app-endpoint' }],
				host: '^9.0.0',
				local: false,
			},
		];

		expect(generateExtensionsEntrypoint(mockExtensions)).toBe(
			`import display0 from './extensions/display/index.js';import operation0 from './extensions/operation/app.js';import {layouts as layoutBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [];export const displays = [display0];export const layouts = [...layoutBundle0];export const modules = [];export const panels = [];export const operations = [operation0,...operationBundle0];`
		);
	});
});
