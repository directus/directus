import { describe, expect, it } from 'vitest';
import type { Extension } from '../../shared/types/index.js';
import { dedupeExtensions, type ExtensionMaps } from './dedupe-extensions.js';

function extension(name: string, type = 'hook'): Extension {
	if (type === 'bundle') {
		return {
			name,
			type,
			path: `/${name}`,
			entrypoint: { app: 'dist/app.js', api: 'dist/api.js' },
			entries: [{ name: 'entry', type: 'hook' }],
			host: '^10.0.0',
			local: true,
			partial: false,
		} as Extension;
	}

	return { name, type, path: `/${name}`, entrypoint: 'dist/index.js', local: true } as Extension;
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

describe('dedupeExtensions', () => {
	it('keeps a single copy with precedence local > registry > module', () => {
		const { extensions, shadowed } = dedupeExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
				registry: { 'registry-id': extension('my-extension') },
				module: { 'my-extension': extension('my-extension') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: ['my-extension'], registry: [], module: [] });

		expect(shadowed.map(({ source, folder, shadowedBy }) => ({ source, folder, shadowedBy }))).toEqual([
			{ source: 'registry', folder: 'registry-id', shadowedBy: { source: 'local', folder: 'my-extension' } },
			{ source: 'module', folder: 'my-extension', shadowedBy: { source: 'local', folder: 'my-extension' } },
		]);
	});

	it('prefers a registry copy over a module copy', () => {
		const { extensions } = dedupeExtensions(
			maps({
				registry: { 'registry-id': extension('my-extension') },
				module: { 'my-extension': extension('my-extension') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: [], registry: ['registry-id'], module: [] });
	});

	it('dedupes bundles', () => {
		const { extensions } = dedupeExtensions(
			maps({
				local: { 'my-bundle': extension('my-bundle', 'bundle') },
				module: { 'my-bundle': extension('my-bundle', 'bundle') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: ['my-bundle'], registry: [], module: [] });
	});

	it('keeps extensions that share a name but have different types', () => {
		const { extensions, shadowed } = dedupeExtensions(
			maps({
				local: { 'my-extension': extension('my-extension') },
				module: { 'my-extension': extension('my-extension', 'endpoint') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: ['my-extension'], registry: [], module: ['my-extension'] });
		expect(shadowed).toEqual([]);
	});

	it('keeps copies within the same source', () => {
		const { extensions, shadowed } = dedupeExtensions(
			maps({
				local: { 'hook-a': extension('my-extension'), 'hook-b': extension('my-extension') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: ['hook-a', 'hook-b'], registry: [], module: [] });
		expect(shadowed).toEqual([]);
	});

	it('keeps unrelated extensions from all sources', () => {
		const { extensions } = dedupeExtensions(
			maps({
				local: { a: extension('a') },
				registry: { 'registry-id': extension('b') },
				module: { c: extension('c') },
			}),
		);

		expect(keys(extensions)).toEqual({ local: ['a'], registry: ['registry-id'], module: ['c'] });
	});

	it('returns the sources in module, registry, local order', () => {
		const { extensions } = dedupeExtensions(maps({}));

		expect(Object.keys(extensions)).toEqual(['module', 'registry', 'local']);
	});
});
