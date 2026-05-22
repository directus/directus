import { describe, expect, test, vi } from 'vitest';
import type { VersionsService } from '../services/versions.js';
import { ensureVersionId } from './ensure-version-id.js';

describe('ensureVersionId', () => {
	test('returns the existing version id when one is found', async () => {
		const versionsService = {
			readByQuery: vi.fn().mockResolvedValue([{ id: 'existing-version' }]),
			createOne: vi.fn(),
		};

		const id = await ensureVersionId(versionsService as unknown as VersionsService, {
			collection: 'pages',
			item: 1,
			versionKey: 'draft',
		});

		expect(id).toBe('existing-version');
		expect(versionsService.createOne).not.toHaveBeenCalled();
	});

	test('creates a new version when none exists', async () => {
		const versionsService = {
			readByQuery: vi.fn().mockResolvedValue([]),
			createOne: vi.fn().mockResolvedValue('new-version'),
		};

		const id = await ensureVersionId(versionsService as unknown as VersionsService, {
			collection: 'pages',
			item: 1,
			versionKey: 'draft',
		});

		expect(id).toBe('new-version');

		expect(versionsService.createOne).toHaveBeenCalledWith({
			key: 'draft',
			collection: 'pages',
			item: '1',
		});
	});
});
