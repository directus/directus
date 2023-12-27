import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import { useEnv } from '../../env.js';
import { version } from 'directus/version';
import { getItemCount } from '../utils/get-item-count.js';
import { getUserCount, type UserCount } from '../utils/get-user-count.js';
import { getUserItemCount, type UserItemCount } from '../utils/get-user-item-count.js';
import { getReport } from './get-report.js';

vi.mock('../../database/index.js');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('../../env.js', () => ({ useEnv: vi.fn().mockReturnValue({}) }));

vi.mock('../utils/get-item-count.js');
vi.mock('../utils/get-storage.js');
vi.mock('../utils/get-user-item-count.js');
vi.mock('../utils/get-user-count.js');

let mockEnv: Record<string, unknown>;
let mockDb: Knex;
let mockUserCounts: UserCount;
let mockUserItemCounts: UserItemCount;

beforeEach(() => {
	mockEnv = {
		PUBLIC_URL: 'test-public-url',
	};

	mockDb = {} as unknown as Knex;

	mockUserCounts = { admin: 5, app: 3, api: 15 };

	mockUserItemCounts = { collections: 25, items: 15000 };

	vi.mocked(useEnv).mockReturnValue(mockEnv);
	vi.mocked(getDatabase).mockReturnValue(mockDb);

	vi.mocked(getItemCount).mockResolvedValue({});
	vi.mocked(getUserCount).mockResolvedValue(mockUserCounts);
	vi.mocked(getUserItemCount).mockResolvedValue(mockUserItemCounts);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns environment information', async () => {
	vi.mocked(getDatabaseClient).mockReturnValue('test-db' as any);

	const report = await getReport();

	expect(report.url).toBe(mockEnv['PUBLIC_URL']);
	expect(report.database).toBe('test-db');
	expect(report.version).toBe(version);
});

test('Runs and returns basic counts', async () => {
	const mockItemCount = {
		directus_dashboards: 15,
		directus_extensions: 30,
		directus_files: 45,
		directus_flows: 60,
		directus_roles: 75,
		directus_shares: 90,
	};

	vi.mocked(getItemCount).mockResolvedValue(mockItemCount);

	const report = await getReport();

	expect(getItemCount).toHaveBeenCalledWith(mockDb, [
		'directus_dashboards',
		'directus_extensions',
		'directus_files',
		'directus_flows',
		'directus_roles',
		'directus_shares',
	]);

	expect(report.dashboards).toBe(mockItemCount.directus_dashboards);
	expect(report.extensions).toBe(mockItemCount.directus_extensions);
	expect(report.files).toBe(mockItemCount.directus_files);
	expect(report.flows).toBe(mockItemCount.directus_flows);
	expect(report.roles).toBe(mockItemCount.directus_roles);
	expect(report.shares).toBe(mockItemCount.directus_shares);
});

test('Runs and returns user counts', async () => {
	const report = await getReport();

	expect(getUserCount).toHaveBeenCalledWith(mockDb);

	expect(report.admin_users).toBe(mockUserCounts.admin);
	expect(report.app_users).toBe(mockUserCounts.app);
	expect(report.api_users).toBe(mockUserCounts.api);
});

test('Runs and returns user item counts', async () => {
	const report = await getReport();

	expect(getUserItemCount).toHaveBeenCalledWith(mockDb);

	expect(report.collections).toBe(mockUserItemCounts.collections);
	expect(report.items).toBe(mockUserItemCounts.items);
});
