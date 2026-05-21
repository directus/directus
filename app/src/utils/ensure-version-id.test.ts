import type { AxiosInstance } from 'axios';
import { describe, expect, test, vi } from 'vitest';
import { ensureVersionId } from './ensure-version-id';

describe('ensureVersionId', () => {
	test('returns the existing version id when one is found', async () => {
		const client = {
			get: vi.fn().mockResolvedValue({ data: { data: [{ id: 'existing-version' }] } }),
			post: vi.fn(),
		};

		const id = await ensureVersionId(client as unknown as AxiosInstance, {
			collection: 'pages',
			item: 1,
			versionKey: 'draft',
		});

		expect(id).toBe('existing-version');
		expect(client.post).not.toHaveBeenCalled();
	});

	test('creates a new version when none exists', async () => {
		const client = {
			get: vi.fn().mockResolvedValue({ data: { data: [] } }),
			post: vi.fn().mockResolvedValue({ data: { data: { id: 'new-version' } } }),
		};

		const id = await ensureVersionId(client as unknown as AxiosInstance, {
			collection: 'pages',
			item: 1,
			versionKey: 'draft',
		});

		expect(id).toBe('new-version');

		expect(client.post).toHaveBeenCalledWith('/versions', {
			key: 'draft',
			collection: 'pages',
			item: '1',
		});
	});
});
