import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectFileMetrics } from './files.js';

vi.mock('../../../services/files.js', () => ({
	FilesService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock('../../utils/stats.js', () => ({
	emptyDistribution: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { FilesService } from '../../../services/files.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectFileMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns zero totals when no files exist', async () => {
		const result = await collectFileMetrics(mockDb, mockSchema);
		expect(result.count).toBe(0);
		expect(result.size).toBeDefined();
	});

	test('initialises all MIME groups', async () => {
		const result = await collectFileMetrics(mockDb, mockSchema);
		expect(result.types).toHaveProperty('image');
		expect(result.types).toHaveProperty('video');
		expect(result.types).toHaveProperty('audio');
		expect(result.types).toHaveProperty('application');
		expect(result.types).toHaveProperty('text');
		expect(result.types).toHaveProperty('other');
	});

	test('groups unknown MIME prefixes under other', async () => {
		vi.mocked(FilesService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ type: 'weird/format', countDistinct: { id: 5 }, sum: { filesize: 1500 }, min: { filesize: 100 }, max: { filesize: 500 }, avg: { filesize: 300 } },
			]),
		}) as any);

		const result = await collectFileMetrics(mockDb, mockSchema);
		expect(result.types['other']!.count).toBe(5);
	});

	test('computes overall totals from grouped results', async () => {
		vi.mocked(FilesService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ type: 'image/png', countDistinct: { id: 3 }, sum: { filesize: 900 }, min: { filesize: 100 }, max: { filesize: 500 }, avg: { filesize: 300 } },
				{ type: 'text/plain', countDistinct: { id: 2 }, sum: { filesize: 200 }, min: { filesize: 50 }, max: { filesize: 150 }, avg: { filesize: 100 } },
			]),
		}) as any);

		const result = await collectFileMetrics(mockDb, mockSchema);
		expect(result.count).toBe(5);
		expect(result.size.sum).toBe(1100);
		expect(result.size.min).toBe(50);
		expect(result.size.max).toBe(500);
		expect(result.size.mean).toBe(220);
	});
});
