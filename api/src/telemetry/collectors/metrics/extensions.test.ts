import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../services/extensions.js', () => ({
	ExtensionsService: vi.fn().mockImplementation(() => ({
		readAll: vi.fn().mockResolvedValue([]),
	})),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { ExtensionsService } from '../../../services/extensions.js';
import {
	collectExtensionMetrics,
	createEmptyBreakdown,
} from './extensions.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('createEmptyBreakdown', () => {
	const emptySource = { registry: { count: 0 }, local: { count: 0 }, module: { count: 0 } };
	const emptyCountBySource = { count: 0, source: emptySource };

	test('returns zeroed breakdown with all extension types', () => {
		const result = createEmptyBreakdown();
		expect(result.bundles).toEqual(emptyCountBySource);
		expect(result.individual).toEqual(emptyCountBySource);
		expect(result.type.display).toEqual(emptyCountBySource);
		expect(result.type.interface).toEqual(emptyCountBySource);
		expect(result.type.module).toEqual(emptyCountBySource);
		expect(result.type.layout).toEqual(emptyCountBySource);
		expect(result.type.panel).toEqual(emptyCountBySource);
		expect(result.type.theme).toEqual(emptyCountBySource);
		expect(result.type.endpoint).toEqual(emptyCountBySource);
		expect(result.type.hook).toEqual(emptyCountBySource);
		expect(result.type.operation).toEqual(emptyCountBySource);
		expect(result.type.bundle).toEqual(emptyCountBySource);
	});
});

describe('collectExtensionMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns empty breakdowns when no extensions', async () => {
		const result = await collectExtensionMetrics(mockDb, mockSchema);
		expect(result.active.bundles.count).toBe(0);
		expect(result.active.individual.count).toBe(0);
		expect(result.inactive.bundles.count).toBe(0);
		expect(result.inactive.individual.count).toBe(0);
	});

	test('categorises enabled non-bundled extensions', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{ bundle: null, meta: { enabled: true, source: 'local' }, schema: { type: 'hook' } },
				{ bundle: null, meta: { enabled: true, source: 'registry' }, schema: { type: 'panel' } },
			]),
		}) as any);

		const result = await collectExtensionMetrics(mockDb, mockSchema);

		expect(result.active.bundles.count).toBe(2);
		expect(result.active.bundles.source.local.count).toBe(1);
		expect(result.active.bundles.source.registry.count).toBe(1);
		expect(result.active.individual.count).toBe(2);
		expect(result.active.individual.source.local.count).toBe(1);
		expect(result.active.individual.source.registry.count).toBe(1);
		expect(result.active.type.hook.count).toBe(1);
		expect(result.active.type.panel.count).toBe(1);
		expect(result.inactive.bundles.count).toBe(0);
	});

	test('categorises disabled extensions into inactive breakdown', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{ bundle: null, meta: { enabled: false, source: 'registry' }, schema: { type: 'display' } },
			]),
		}) as any);

		const result = await collectExtensionMetrics(mockDb, mockSchema);

		expect(result.active.bundles.count).toBe(0);
		expect(result.inactive.bundles.count).toBe(1);
		expect(result.inactive.individual.count).toBe(1);
		expect(result.inactive.type.display.count).toBe(1);
	});

	test('skips extensions with null schema entirely', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{ bundle: null, meta: { enabled: true, source: 'registry' }, schema: null },
			]),
		}) as any);

		const result = await collectExtensionMetrics(mockDb, mockSchema);

		expect(result.active.bundles.count).toBe(0);
		expect(result.active.individual.count).toBe(0);
	});

	test('separates bundle and individual counting for bundled extensions', async () => {
		vi.mocked(ExtensionsService).mockImplementation(() => ({
			readAll: vi.fn().mockResolvedValue([
				{ bundle: null, meta: { enabled: true, source: 'registry' }, schema: { type: 'bundle' } },
				{ bundle: 'parent-id', meta: { enabled: true, source: 'registry' }, schema: { type: 'interface' } },
				{ bundle: 'parent-id', meta: { enabled: true, source: 'registry' }, schema: { type: 'interface' } },
			]),
		}) as any);

		const result = await collectExtensionMetrics(mockDb, mockSchema);

		// "bundles" counts the bundle parent, skips children
		expect(result.active.bundles.count).toBe(1);
		expect(result.active.bundles.source.registry.count).toBe(1);

		// "individual" counts the children, skips the bundle parent
		expect(result.active.individual.count).toBe(2);
		expect(result.active.individual.source.registry.count).toBe(2);

		// type tracks everything
		expect(result.active.type.bundle.count).toBe(1);
		expect(result.active.type.interface.count).toBe(2);
	});
});
