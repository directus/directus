import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectTranslationMetrics } from './translations.js';

vi.mock('../../../services/translations.js', () => ({
	TranslationsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock('../../utils/stats.js', () => ({
	distributionFromCounts: vi.fn().mockReturnValue({ min: 5, max: 10, median: 7, mean: 7 }),
	emptyDistribution: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { TranslationsService } from '../../../services/translations.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectTranslationMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns zero counts when no translations', async () => {
		const result = await collectTranslationMetrics(mockDb, mockSchema);
		expect(result.count).toBe(0);
		expect(result.language.count).toBe(0);
	});

	test('sums translations and counts languages', async () => {
		vi.mocked(TranslationsService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ language: 'en', count: 10 },
				{ language: 'de', count: 5 },
			]),
		}) as any);

		const result = await collectTranslationMetrics(mockDb, mockSchema);
		expect(result.count).toBe(15);
		expect(result.language.count).toBe(2);
	});

	test('gracefully returns zeroes on error', async () => {
		vi.mocked(TranslationsService).mockImplementation(() => ({
			readByQuery: vi.fn().mockRejectedValue(new Error('DB error')),
		}) as any);

		const result = await collectTranslationMetrics(mockDb, mockSchema);
		expect(result.count).toBe(0);
		expect(result.language.count).toBe(0);
	});
});
