import { afterEach, describe, expect, test, vi } from 'vitest';
import { getService } from '../utils/get-service.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../utils/get-service.js', async () => {
	const { ItemsService } = await import('./items.js');
	return { getService: vi.fn((collection, options) => new ItemsService(collection, options)) };
});

describe('Services / Revisions', () => {
	const knex = {} as any;
	const schema = { collections: {}, relations: [] } as any;
	const service = new RevisionsService({ knex, schema });

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('uses the collection-specific service when reverting a system collection', async () => {
		vi.mocked(ItemsService.prototype.readOne).mockResolvedValueOnce({
			collection: 'directus_users',
			item: 'user-id',
			data: { first_name: 'Before' },
		});

		await service.revert('revision-id');

		expect(vi.mocked(getService)).toHaveBeenCalledWith(
			'directus_users',
			expect.objectContaining({ knex, schema, accountability: null }),
		);

		expect(ItemsService.prototype.updateOne).toHaveBeenCalledWith('user-id', { first_name: 'Before' });
	});
});
