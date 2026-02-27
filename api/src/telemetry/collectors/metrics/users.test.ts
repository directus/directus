import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectUserMetrics } from './users.js';

vi.mock('../../../utils/fetch-user-count/fetch-user-count.js', () => ({
	fetchUserCount: vi.fn().mockResolvedValue({ admin: 0, app: 0, api: 0 }),
}));

import type { Knex } from 'knex';
import { fetchUserCount } from '../../../utils/fetch-user-count/fetch-user-count.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectUserMetrics', () => {
	const mockDb = {} as Knex;

	test('returns zero counts when no users', async () => {
		const result = await collectUserMetrics(mockDb);
		expect(result.admin.count).toBe(0);
		expect(result.app.count).toBe(0);
		expect(result.api.count).toBe(0);
	});

	test('maps user counts to structured output', async () => {
		vi.mocked(fetchUserCount).mockResolvedValue({ admin: 2, app: 10, api: 5 });
		const result = await collectUserMetrics(mockDb);
		expect(result.admin.count).toBe(2);
		expect(result.app.count).toBe(10);
		expect(result.api.count).toBe(5);
	});
});
