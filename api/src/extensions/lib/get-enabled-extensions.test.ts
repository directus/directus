import type { Extension, ExtensionSettings } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger/index.js';
import { type ExtensionMaps, getEnabledExtensions } from './get-enabled-extensions.js';

vi.mock('../../logger/index.js');

const logger = { warn: vi.fn() };

beforeEach(() => {
	vi.mocked(useLogger).mockReturnValue(logger as any);
	logger.warn.mockReset();
});

function extension(name: string, type = 'hook'): Extension {
	return { name, type, path: `/${name}`, entrypoint: 'dist/index.js', local: true } as Extension;
}

function setting(
	source: ExtensionSettings['source'],
	folder: string,
	enabled = true,
	bundle: string | null = null,
): ExtensionSettings {
	return { id: `${source}-${folder}`, source, folder, enabled, bundle };
}

function maps(maps: Partial<Record<keyof ExtensionMaps, Record<string, Extension>>>): ExtensionMaps {
	return {
		local: new Map(Object.entries(maps.local ?? {})),
		registry: new Map(Object.entries(maps.registry ?? {})),
		module: new Map(Object.entries(maps.module ?? {})),
	};
}

function keys(extensions: ExtensionMaps) {
	return {
		local: [...extensions.local.keys()],
		registry: [...extensions.registry.keys()],
		module: [...extensions.module.keys()],
	};
}

describe('getEnabledExtensions', () => {
	test('should keep a single copy with precedence local > registry > module', () => {
		const result = getEnabledExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
				registry: { 'registry-id': extension('my-extension') },
				module: { 'my-extension': extension('my-extension') },
			}),
			[setting('local', 'my-extension'), setting('registry', 'registry-id'), setting('module', 'my-extension')],
		);

		expect(keys(result)).toEqual({ local: ['my-extension'], registry: [], module: [] });
		expect(logger.warn).toHaveBeenCalledTimes(2);
	});

	test('should prefer a registry copy over a module copy', () => {
		const result = getEnabledExtensions(
			maps({
				registry: { 'registry-id': extension('my-extension') },
				module: { 'my-extension': extension('my-extension') },
			}),
			[setting('registry', 'registry-id'), setting('module', 'my-extension')],
		);

		expect(keys(result)).toEqual({ local: [], registry: ['registry-id'], module: [] });
	});

	test('should fall back to the next enabled copy when a higher precedence copy is disabled', () => {
		const result = getEnabledExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
				module: { 'my-extension': extension('my-extension') },
			}),
			[setting('local', 'my-extension', false), setting('module', 'my-extension')],
		);

		expect(keys(result)).toEqual({ local: [], registry: [], module: ['my-extension'] });
		expect(logger.warn).not.toHaveBeenCalled();
	});

	test('should dedupe by name regardless of type', () => {
		const result = getEnabledExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
				module: { 'my-extension': extension('my-extension', 'endpoint') },
			}),
			[setting('local', 'my-extension'), setting('module', 'my-extension')],
		);

		expect(keys(result)).toEqual({ local: ['my-extension'], registry: [], module: [] });
	});

	test('should dedupe copies within the same source', () => {
		const result = getEnabledExtensions(
			maps({
				local: { 'folder-a': extension('my-extension'), 'folder-b': extension('my-extension') },
			}),
			[setting('local', 'folder-a'), setting('local', 'folder-b')],
		);

		expect(keys(result)).toEqual({ local: ['folder-a'], registry: [], module: [] });
		expect(logger.warn).toHaveBeenCalledTimes(1);
	});

	test('should skip extensions that are disabled or have no settings', () => {
		const result = getEnabledExtensions(
			maps({
				local: { disabled: extension('disabled'), unknown: extension('unknown') },
			}),
			[setting('local', 'disabled', false)],
		);

		expect(keys(result)).toEqual({ local: [], registry: [], module: [] });
	});

	test('should ignore bundle entry settings that share a folder name', () => {
		const result = getEnabledExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
			}),
			[setting('local', 'my-extension', false), setting('local', 'my-extension', true, 'some-bundle')],
		);

		expect(keys(result)).toEqual({ local: [], registry: [], module: [] });
	});

	test('should keep unrelated extensions from all sources', () => {
		const result = getEnabledExtensions(
			maps({
				local: { a: extension('a') },
				registry: { 'registry-id': extension('b') },
				module: { c: extension('c') },
			}),
			[setting('local', 'a'), setting('registry', 'registry-id'), setting('module', 'c')],
		);

		expect(keys(result)).toEqual({ local: ['a'], registry: ['registry-id'], module: ['c'] });
	});
});
