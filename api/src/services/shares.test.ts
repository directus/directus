import { InvalidPayloadError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCache as clearPermissionsCache } from '../permissions/cache.js';
import { ItemsService } from './items.js';
import { SharesService } from './shares.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({ error: vi.fn() }),
}));

vi.mock('../permissions/cache.js', () => ({
	clearCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

describe('SharesService', () => {
	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	const service = new SharesService({
		schema: mockSchema,
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('updateMany', () => {
		it('should reject a payload that changes user_created without reaching super.updateMany', async () => {
			await expect(service.updateMany(['share-id-1'], { user_created: 'some-admin-uuid' })).rejects.toStrictEqual(
				new InvalidPayloadError({ reason: `You can't change the "user_created" value manually` }),
			);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
			expect(clearPermissionsCache).not.toHaveBeenCalled();
		});

		it('should pass through and clear the permissions cache when user_created is absent', async () => {
			vi.mocked(ItemsService.prototype.updateMany).mockResolvedValue(['share-id-1']);

			const result = await service.updateMany(['share-id-1'], { name: 'renamed share' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(
				['share-id-1'],
				{ name: 'renamed share' },
				undefined,
			);

			expect(clearPermissionsCache).toHaveBeenCalled();
			expect(result).toStrictEqual(['share-id-1']);
		});
	});
});
