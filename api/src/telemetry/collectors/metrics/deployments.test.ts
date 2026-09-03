import type { SchemaOverview } from '@directus/types';
import { DEPLOYMENT_PROVIDER_TYPES } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';
import { collectDeploymentMetrics } from './deployments.js';

vi.mock('../../utils/count-by-column.js');
vi.mock('../../utils/service-count.js');

const mockDb = {} as Knex;
const mockSchema = {} as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectDeploymentMetrics', () => {
	test('returns deployments, provider breakdown, projects and runs', async () => {
		vi.mocked(serviceCount).mockImplementation(async (_db, _schema, collection) => {
			return (
				{ directus_deployments: 2, directus_deployment_projects: 5, directus_deployment_runs: 40 }[collection] ?? 0
			);
		});

		vi.mocked(countByColumn).mockResolvedValue({ vercel: { count: 1 }, netlify: { count: 1 }, custom: { count: 0 } });

		const result = await collectDeploymentMetrics(mockDb, mockSchema);

		expect(result).toStrictEqual({
			count: 2,
			provider: { vercel: { count: 1 }, netlify: { count: 1 }, custom: { count: 0 } },
			projects: { count: 5 },
			runs: { count: 40 },
		});
	});

	test('groups by the supported provider list rather than a hardcoded one', async () => {
		vi.mocked(serviceCount).mockResolvedValue(0);
		vi.mocked(countByColumn).mockResolvedValue({});

		await collectDeploymentMetrics(mockDb, mockSchema);

		expect(countByColumn).toHaveBeenCalledWith(mockDb, 'directus_deployments', 'provider', DEPLOYMENT_PROVIDER_TYPES);
	});
});
