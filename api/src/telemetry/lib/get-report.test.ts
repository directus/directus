import { useEnv } from '@directus/env';
import { version } from 'directus/version';
import { type Knex } from 'knex';
import { describe, afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import { fetchUserCount, type UserCount } from '../../utils/fetch-user-count/fetch-user-count.js';
import { type ExtensionCount, getExtensionCount } from '../utils/get-extension-count.js';
import { type FieldCount, getFieldCount } from '../utils/get-field-count.js';
import { type FilesizeSum, getFilesizeSum } from '../utils/get-filesize-sum.js';
import { getItemCount } from '../utils/get-item-count.js';
import { getSettings, type TelemetrySettings } from '../utils/get-settings.js';
import { getUserItemCount, type UserItemCount } from '../utils/get-user-item-count.js';
import { useBufferedCounter } from '../counter/use-buffered-counter.js';
import { formatApiRequestCounts } from '../utils/format-api-request-counts.js';
import { getReport } from './get-report.js';

vi.mock('../../database/index.js');

vi.mock('../../database/helpers/index.js', () => ({
	getHelpers: vi.fn().mockImplementation(() => ({
		schema: {
			getDatabaseSize: vi.fn().mockReturnValue(0),
		},
	})),
}));

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

vi.mock('../utils/get-item-count.js');
vi.mock('../utils/get-storage.js');
vi.mock('../utils/get-user-item-count.js');
vi.mock('../utils/get-field-count.js');
vi.mock('../utils/get-extension-count.js');
vi.mock('../../utils/fetch-user-count/fetch-user-count.js');
vi.mock('../utils/get-filesize-sum.js');
vi.mock('../utils/get-settings.js');
vi.mock('../counter/use-buffered-counter.js');
vi.mock('../utils/format-api-request-counts.js');

let mockEnv: Record<string, unknown>;
let mockDb: Knex;
let mockUserCounts: UserCount;
let mockUserItemCounts: UserItemCount;
let mockFieldCounts: FieldCount;
let mockExtensionCounts: ExtensionCount;
let mockFilesizeSums: FilesizeSum;
let mockSettings: TelemetrySettings;
let mockRequestCounts: Record<string, number>;

beforeEach(() => {
	mockEnv = {
		PUBLIC_URL: 'test-public-url',
	};

	mockDb = {} as unknown as Knex;

	mockUserCounts = { admin: 5, app: 3, api: 15 };

	mockUserItemCounts = { collections: 25, items: 15000 };

	mockFieldCounts = { max: 28, total: 88 };

	mockExtensionCounts = { totalEnabled: 55 };

	mockFilesizeSums = { total: 10 };

	mockSettings = {
		project_id: 'test-project-id',
		mcp_enabled: true,
		mcp_allow_deletes: false,
		mcp_system_prompt_enabled: true,
		visual_editor_urls: 2,
		ai_openai_api_key: false,
		ai_anthropic_api_key: false,
		ai_system_prompt: false,
		collaborative_editing_enabled: false,
	};

	mockRequestCounts = { get: 100, post: 50, patch: 20, delete: 5 };

	vi.mocked(useEnv).mockReturnValue(mockEnv);
	vi.mocked(getDatabase).mockReturnValue(mockDb);

	vi.mocked(useBufferedCounter).mockReturnValue({
		increment: vi.fn(),
		flush: vi.fn(),
		flushAll: vi.fn(),
		getAndResetAll: vi.fn().mockResolvedValue(mockRequestCounts),
		destroy: vi.fn(),
	});

	vi.mocked(formatApiRequestCounts).mockReturnValue({
		api_requests_get: 100,
		api_requests_post: 50,
		api_requests_patch: 20,
		api_requests_delete: 5,
		api_requests: 175,
	});

	vi.mocked(getItemCount).mockResolvedValue({});
	vi.mocked(fetchUserCount).mockResolvedValue(mockUserCounts);
	vi.mocked(getUserItemCount).mockResolvedValue(mockUserItemCounts);
	vi.mocked(getFieldCount).mockResolvedValue(mockFieldCounts);
	vi.mocked(getExtensionCount).mockResolvedValue(mockExtensionCounts);
	vi.mocked(getFilesizeSum).mockResolvedValue(mockFilesizeSums);
	vi.mocked(getSettings).mockResolvedValue(mockSettings);
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
		directus_files: 45,
		directus_flows: 60,
		directus_roles: 75,
		directus_shares: 90,
	};

	vi.mocked(getItemCount).mockResolvedValue(mockItemCount);

	const report = await getReport();

	expect(getItemCount).toHaveBeenCalledWith(mockDb, [
		{ collection: 'directus_dashboards' },
		{ collection: 'directus_files' },
		{ collection: 'directus_flows', where: ['status', '=', 'active'] },
		{ collection: 'directus_roles' },
		{ collection: 'directus_shares' },
	]);

	expect(report.dashboards).toBe(mockItemCount.directus_dashboards);
	expect(report.files).toBe(mockItemCount.directus_files);
	expect(report.flows).toBe(mockItemCount.directus_flows);
	expect(report.roles).toBe(mockItemCount.directus_roles);
	expect(report.shares).toBe(mockItemCount.directus_shares);
});

test('Runs and returns user counts', async () => {
	const report = await getReport();

	expect(fetchUserCount).toHaveBeenCalledWith({ knex: mockDb });

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

test('Runs and returns field counts', async () => {
	const report = await getReport();

	expect(getFieldCount).toHaveBeenCalledWith(mockDb);

	expect(report.fields_max).toBe(mockFieldCounts.max);
	expect(report.fields_total).toBe(mockFieldCounts.total);
});

test('Runs and returns extension counts', async () => {
	const report = await getReport();

	expect(getExtensionCount).toHaveBeenCalledWith(mockDb);

	expect(report.extensions).toBe(mockExtensionCounts.totalEnabled);
});

test('Runs and returns extension counts', async () => {
	const report = await getReport();

	expect(getFilesizeSum).toHaveBeenCalledWith(mockDb);

	expect(report.files_size_total).toBe(mockFilesizeSums.total);
});

test('Runs and returns settings', async () => {
	const report = await getReport();

	expect(getSettings).toHaveBeenCalledWith(mockDb);

	expect(report.project_id).toBe(mockSettings.project_id);
	expect(report.mcp_enabled).toBe(mockSettings.mcp_enabled);
	expect(report.mcp_allow_deletes).toBe(mockSettings.mcp_allow_deletes);
	expect(report.mcp_system_prompt_enabled).toBe(mockSettings.mcp_system_prompt_enabled);
	expect(report.visual_editor_urls).toBe(mockSettings.visual_editor_urls);
});

test('Runs and returns formatted API request counts', async () => {
	const report = await getReport();

	expect(useBufferedCounter).toHaveBeenCalledWith('api-requests');
	expect(formatApiRequestCounts).toHaveBeenCalledWith(mockRequestCounts);

	expect(report.api_requests_get).toBe(100);
	expect(report.api_requests_post).toBe(50);
	expect(report.api_requests_patch).toBe(20);
	expect(report.api_requests_delete).toBe(5);
	expect(report.api_requests_put).toBeUndefined();
	expect(report.api_requests).toBe(175);
});
