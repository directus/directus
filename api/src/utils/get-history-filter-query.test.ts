import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getHistoryFilterQuery } from './get-history-filter-query.js';

const entitlements = vi.hoisted(() => ({ getEntitlementLimit: vi.fn() }));

vi.mock('../license/index.js', () => ({ getEntitlementManager: () => entitlements }));

const DAY_S = 24 * 60 * 60;
const NOW = new Date('2026-09-25T12:00:00.000Z');

const byTimestamp = (since: Date) => ({ timestamp: { _gte: since.toISOString() } });

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

describe('getHistoryFilterQuery', () => {
	test('an unlimited timeframe leaves the query untouched', () => {
		entitlements.getEntitlementLimit.mockReturnValue(-1);
		const query = { filter: { collection: { _eq: 'articles' } } };

		expect(getHistoryFilterQuery(query, 'activity_historical_timeframe', byTimestamp)).toBe(query);
	});

	test('a zero timeframe returns no rows', () => {
		entitlements.getEntitlementLimit.mockReturnValue(0);

		expect(getHistoryFilterQuery({}, 'activity_historical_timeframe', byTimestamp)).toEqual({ limit: 0 });
	});

	test('a limited timeframe filters from exactly the limit ago', () => {
		entitlements.getEntitlementLimit.mockReturnValue(7 * DAY_S);

		expect(getHistoryFilterQuery({}, 'revision_historical_timeframe', byTimestamp)).toEqual({
			filter: { timestamp: { _gte: '2026-09-18T12:00:00.000Z' } },
		});

		expect(entitlements.getEntitlementLimit).toHaveBeenCalledWith('revision_historical_timeframe');
	});

	test('the caller filter is kept alongside the timeframe filter, so it cannot widen it', () => {
		entitlements.getEntitlementLimit.mockReturnValue(7 * DAY_S);

		const result = getHistoryFilterQuery(
			{ filter: { timestamp: { _gte: '2020-01-01T00:00:00.000Z' } } },
			'activity_historical_timeframe',
			byTimestamp,
		);

		expect(result).toEqual({
			filter: {
				_and: [
					{ timestamp: { _gte: '2026-09-18T12:00:00.000Z' } },
					{ timestamp: { _gte: '2020-01-01T00:00:00.000Z' } },
				],
			},
		});
	});
});
