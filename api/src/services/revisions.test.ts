import { SchemaBuilder } from '@directus/schema-builder';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getService } from '../utils/get-service.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../utils/get-service.js', () => ({
	getService: vi.fn(),
}));

const schema = new SchemaBuilder()
	.collection('directus_users', (c) => {
		c.field('id').id();
		c.field('first_name').string();

		c.field('password')
			.hash()
			.options({ special: ['hash', 'conceal'] });

		c.field('tfa_secret')
			.string()
			.options({ special: ['conceal'] });
	})
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.build();

afterEach(() => {
	vi.restoreAllMocks();
});

describe('RevisionsService.revert', () => {
	test.each([
		{ password: '**********', tfa_secret: '**********' },
		{ password: '**********', tfa_secret: null },
		{ password: null, tfa_secret: null },
	])('should route the write through getService and omit concealed fields %o', async (concealed) => {
		const updateOne = vi.fn();
		vi.mocked(getService).mockReturnValue({ updateOne } as any);

		vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
			collection: 'directus_users',
			item: '1',
			data: { first_name: 'Original', ...concealed },
		});

		const service = new RevisionsService({ knex: {} as any, schema, accountability: null });

		await service.revert(1);

		expect(getService).toHaveBeenCalledWith('directus_users', expect.objectContaining({ schema }));
		expect(updateOne).toHaveBeenCalledWith('1', { first_name: 'Original' });
	});

	test('should keep values of fields that are not concealed', async () => {
		const updateOne = vi.fn();
		vi.mocked(getService).mockReturnValue({ updateOne } as any);

		vi.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue({
			collection: 'articles',
			item: '1',
			data: { title: '**********' },
		});

		const service = new RevisionsService({ knex: {} as any, schema, accountability: null });

		await service.revert(1);

		expect(updateOne).toHaveBeenCalledWith('1', { title: '**********' });
	});
});
