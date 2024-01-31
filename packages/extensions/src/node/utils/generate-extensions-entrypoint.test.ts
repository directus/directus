import { describe, expect, it } from 'vitest';
import type { Extension, ExtensionSettings } from '../../shared/types/index.js';
import { generateExtensionsEntrypoint } from './generate-extensions-entrypoint.js';

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
				host: '^10.0.0',
				local: false,
			},
		];

		const mockSettings: ExtensionSettings[] = [{ name: 'mock-bundle0-extension', enabled: true }];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [];"`,
		);
	});

	it('returns an empty extension entrypoint if there are no enabled extensions', () => {
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
				host: '^10.0.0',
				local: false,
			},
			{
				path: './extensions/bundle-no-app',
				name: 'mock-bundle-no-app-extension',
				version: '1.0.0',
				type: 'bundle',
				entrypoint: { app: 'app.js', api: 'api.js' },
				entries: [{ type: 'endpoint', name: 'mock-bundle-no-app-endpoint' }],
				host: '^10.0.0',
				local: false,
			},
		];

		const mockSettings: ExtensionSettings[] = [
			{ name: 'mock-display-extension', enabled: false },
			{ name: 'mock-operation-extension', enabled: false },
			{ name: 'mock-bundle0-extension/mock-bundle-layout', enabled: false },
			{ name: 'mock-bundle0-extension/mock-bundle-operation', enabled: false },
			{ name: 'mock-bundle0-extension/mock-bundle-hook', enabled: false },
			{ name: 'mock-bundle-no-app-extension/mock-bundle-no-app-endpoint', enabled: false },
		];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [];"`,
		);
	});

	it('returns an extension entrypoint exporting a single App extension', () => {
		const mockExtensions: Extension[] = [
			{ path: './extensions/panel', name: 'mock-panel-extension', type: 'panel', entrypoint: 'index.js', local: true },
		];

		const mockSettings: ExtensionSettings[] = [{ name: 'mock-panel-extension', enabled: true }];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import panel0 from './extensions/panel/index.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [panel0];export const themes = [];export const operations = [];"`,
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

		const mockSettings: ExtensionSettings[] = [{ name: 'mock-operation-extension', enabled: true }];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import operation0 from './extensions/operation/app.js';export const interfaces = [];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [operation0];"`,
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
				host: '^10.0.0',
				local: false,
			},
		];

		const mockSettings: ExtensionSettings[] = [
			{ name: 'mock-bundle-extension/mock-bundle-interface', enabled: true },
			{ name: 'mock-bundle-extension/mock-bundle-operation', enabled: true },
			{ name: 'mock-bundle-extension/mock-bundle-hook', enabled: true },
		];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import {interfaces as interfaceBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [...interfaceBundle0];export const displays = [];export const layouts = [];export const modules = [];export const panels = [];export const themes = [];export const operations = [...operationBundle0];"`,
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
				host: '^10.0.0',
				local: false,
			},
			{
				path: './extensions/bundle-no-app',
				name: 'mock-bundle-no-app-extension',
				version: '1.0.0',
				type: 'bundle',
				entrypoint: { app: 'app.js', api: 'api.js' },
				entries: [{ type: 'endpoint', name: 'mock-bundle-no-app-endpoint' }],
				host: '^10.0.0',
				local: false,
			},
		];

		const mockSettings: ExtensionSettings[] = [
			{ name: 'mock-display-extension', enabled: true },
			{ name: 'mock-operation-extension', enabled: true },
			{ name: 'mock-bundle0-extension/mock-bundle-layout', enabled: true },
			{ name: 'mock-bundle0-extension/mock-bundle-operation', enabled: true },
			{ name: 'mock-bundle0-extension/mock-bundle-hook', enabled: true },
			{ name: 'mock-bundle-no-app-extension/mock-bundle-no-app-endpoint', enabled: true },
		];

		expect(generateExtensionsEntrypoint(mockExtensions, mockSettings)).toMatchInlineSnapshot(
			`"import display0 from './extensions/display/index.js';import operation0 from './extensions/operation/app.js';import {layouts as layoutBundle0,operations as operationBundle0} from './extensions/bundle/app.js';export const interfaces = [];export const displays = [display0];export const layouts = [...layoutBundle0];export const modules = [];export const panels = [];export const themes = [];export const operations = [operation0,...operationBundle0];"`,
		);
	});
});
