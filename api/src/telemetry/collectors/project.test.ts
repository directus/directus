import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectProject } from './project.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('directus/version', () => ({
	version: '11.0.0',
}));

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: vi.fn().mockResolvedValue({ project_id: '018cc701-e800-7000-8000-000000000000' }),
	})),
}));

vi.mock('../utils/derive-created-at-from-uuid.js', () => ({
	deriveCreatedAtFromUuid: vi.fn().mockReturnValue('2024-01-01T00:00:00.000Z'),
}));

vi.mock('./meta.js', () => ({
	collectMeta: vi.fn().mockReturnValue({ host: 'unknown' }),
}));

vi.mock('../utils/get-templates-applied.js', () => ({
	getTemplatesApplied: vi.fn().mockReturnValue([]),
}));

import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectProject', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns project info with id, version, and host', async () => {
		const result = await collectProject(mockDb, mockSchema);
		expect(result.id).toBe('018cc701-e800-7000-8000-000000000000');
		expect(result.version).toBe('11.0.0');
		expect(result.created_at).toBe('2024-01-01T00:00:00.000Z');
	});

	test('returns empty templates_applied', async () => {
		const result = await collectProject(mockDb, mockSchema);
		expect(result.templates_applied).toEqual([]);
	});
});
