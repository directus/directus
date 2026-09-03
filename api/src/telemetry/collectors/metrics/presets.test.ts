import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { serviceCount } from '../../utils/service-count.js';
import { collectPresetMetrics } from './presets.js';

vi.mock('../../utils/service-count.js');

const mockSchema = {} as SchemaOverview;

const mockDb = (bookmarks: string) =>
	vi.fn().mockReturnValue({
		whereNotNull: vi.fn().mockReturnThis(),
		count: vi.fn().mockResolvedValue([{ count: bookmarks }]),
	}) as unknown as Knex;

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectPresetMetrics', () => {
	test('separates saved bookmarks from default views', async () => {
		vi.mocked(serviceCount).mockResolvedValue(12);

		const result = await collectPresetMetrics(mockDb('4'), mockSchema);

		expect(result).toStrictEqual({ count: 12, bookmarks: { count: 4 } });
	});

	test('reports zero bookmarks when none are saved', async () => {
		vi.mocked(serviceCount).mockResolvedValue(3);

		const result = await collectPresetMetrics(mockDb('0'), mockSchema);

		expect(result.bookmarks).toStrictEqual({ count: 0 });
	});
});
