import { InvalidPayloadError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { ItemsService } from './items.js';
import { SharesService } from './shares.js';

vi.mock('@directus/env', () => ({ useEnv: vi.fn().mockReturnValue({}) }));
vi.mock('../logger/index.js', () => ({ useLogger: vi.fn().mockReturnValue({ error: vi.fn() }) }));

vi.mock('../permissions/cache.js', () => ({ clearCache: vi.fn(), useCache: vi.fn() }));
vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('./mail/index.js', () => ({ MailService: vi.fn() }));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

describe('SharesService', () => {
	const schema = { collections: {}, relations: [] } as SchemaOverview;
	const accountability = { role: 'test', admin: false } as Accountability;

	const db = vi.mocked(knex.default({ client: MockClient }));
	const tracker = createTracker(db);

	const service = new SharesService({ knex: db, schema, accountability });

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('updateMany', () => {
		test('rejects changing user_created before mutating', async () => {
			await expect(service.updateMany(['1'], { user_created: 'admin' })).rejects.toStrictEqual(
				new InvalidPayloadError({ reason: `You can't change the "user_created" value manually` }),
			);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('clears the permissions cache on success', async () => {
			await service.updateMany(['1'], { name: 'renamed' });

			expect(validateAccess).not.toHaveBeenCalled();
			expect(clearPermissionsCache).toHaveBeenCalled();
		});

		test('validates the given pair without fetching when item and collection are both provided', async () => {
			await service.updateMany(['1'], { collection: 'articles', item: '2' });

			expect(tracker.history.select).toHaveLength(0);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ collection: 'articles', primaryKeys: ['2'] }),
				expect.anything(),
			);
		});

		test('fetches the missing side and validates each collection once', async () => {
			tracker.on.select('directus_shares').response([
				{ collection: 'articles', item: '1' },
				{ collection: 'posts', item: '9' },
			]);

			await service.updateMany(['1', '2'], { item: '5' });

			expect(validateAccess).toHaveBeenCalledTimes(2);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ collection: 'articles', primaryKeys: ['5'] }),
				expect.anything(),
			);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ collection: 'posts', primaryKeys: ['5'] }),
				expect.anything(),
			);
		});

		test('groups items under a single collection when only collection changes', async () => {
			tracker.on.select('directus_shares').response([
				{ collection: 'articles', item: '1' },
				{ collection: 'posts', item: '9' },
			]);

			await service.updateMany(['1', '2'], { collection: 'reviews' });

			expect(validateAccess).toHaveBeenCalledTimes(1);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ collection: 'reviews', primaryKeys: ['1', '9'] }),
				expect.anything(),
			);
		});
	});
});
