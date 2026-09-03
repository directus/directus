import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';
import { collectOAuthClientMetrics } from './oauth-clients.js';

vi.mock('../../utils/count-by-column.js');
vi.mock('../../utils/service-count.js');

const mockDb = {} as Knex;
const mockSchema = {} as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectOAuthClientMetrics', () => {
	test('returns the total and the breakdown by registration type', async () => {
		vi.mocked(serviceCount).mockResolvedValue(3);
		vi.mocked(countByColumn).mockResolvedValue({ dcr: { count: 2 }, cimd: { count: 1 }, custom: { count: 0 } });

		const result = await collectOAuthClientMetrics(mockDb, mockSchema);

		expect(result).toStrictEqual({
			count: 3,
			registration: { dcr: { count: 2 }, cimd: { count: 1 }, custom: { count: 0 } },
		});
	});

	test('never reports client names or redirect uris', async () => {
		vi.mocked(serviceCount).mockResolvedValue(1);
		vi.mocked(countByColumn).mockResolvedValue({ dcr: { count: 1 } });

		const result = await collectOAuthClientMetrics(mockDb, mockSchema);

		expect(Object.keys(result).sort()).toStrictEqual(['count', 'registration']);
	});
});
