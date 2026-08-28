import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CommentsService } from './comments.js';
import { ItemsService } from './items.js';

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('./users.js', () => ({ UsersService: vi.fn() }));

describe('CommentsService', () => {
	const schema = { collections: {}, relations: [] } as SchemaOverview;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('updateMany', () => {
		test('rejects when accountability has no user, before mutating', async () => {
			const accountability = { role: null, user: null, admin: false } as unknown as Accountability;
			const service = new CommentsService({ schema, accountability });

			await expect(service.updateMany(['1'], { comment: 'edited by public' })).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('delegates to ItemsService.updateMany when a user is present', async () => {
			const accountability = { role: 'test', user: 'user-id', admin: false } as Accountability;
			const service = new CommentsService({ schema, accountability });

			await service.updateMany(['1'], { comment: 'edited by user' });

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(['1'], { comment: 'edited by user' }, undefined);
		});
	});

	describe('deleteMany', () => {
		test('rejects when accountability has no user, before mutating', async () => {
			const accountability = { role: null, user: null, admin: false } as unknown as Accountability;
			const service = new CommentsService({ schema, accountability });

			await expect(service.deleteMany(['1'])).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test('delegates to ItemsService.deleteMany when a user is present', async () => {
			const accountability = { role: 'test', user: 'user-id', admin: false } as Accountability;
			const service = new CommentsService({ schema, accountability });

			await service.deleteMany(['1']);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(['1'], undefined);
		});
	});
});
