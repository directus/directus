import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, Notification, SchemaOverview } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { CommentsService } from './comments.js';
import { ItemsService } from './items.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

vi.mock('../logger/index.js', () => {
	const logger = { warn: vi.fn(), error: vi.fn() };
	return { useLogger: () => logger };
});

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv({ PUBLIC_URL: 'http://localhost:8055' });
});

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('../permissions/lib/fetch-roles-tree.js', () => ({ fetchRolesTree: vi.fn().mockResolvedValue([]) }));

vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.js', () => ({
	fetchGlobalAccess: vi.fn().mockResolvedValue({ admin: false, app: false }),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('./users.js', async () => {
	const { mockUsersService } = await import('../test-utils/services/users-service.js');
	return mockUsersService();
});

vi.mock('./notifications.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	const { ItemsService: NotificationsService } = mockItemsService();
	return { NotificationsService };
});

const MENTIONED_USER = '8f4e6c9a-1b2d-4e3f-9a7b-5c6d7e8f9a0b';
const OTHER_USER = '1a2b3c4d-5e6f-4a8b-b9c0-d1e2f3a4b5c6';

describe('CommentsService', () => {
	const schema = { collections: {}, relations: [] } as SchemaOverview;
	const accountability = { role: 'test', user: 'author-id', admin: false } as Accountability;
	const anonymous = { role: null, user: null, admin: false } as unknown as Accountability;

	const validPayload = { comment: 'A comment', collection: 'articles', item: '1' };

	const db = vi.mocked(knex.default({ client: MockClient }));
	const tracker = createTracker(db);

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('createOne', () => {
		test('rejects when accountability has no user, before validating payload', async () => {
			const service = new CommentsService({ schema, accountability: anonymous });

			await expect(service.createOne({})).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		});

		test.each([
			['comment', { collection: 'articles', item: '1' }],
			['collection', { comment: 'A comment', item: '1' }],
			['item', { comment: 'A comment', collection: 'articles' }],
		])('rejects when "%s" is missing, before creating', async (field, payload) => {
			const service = new CommentsService({ schema, accountability });

			await expect(service.createOne(payload)).rejects.toStrictEqual(
				new InvalidPayloadError({ reason: `"${field}" is required` }),
			);

			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		});

		test('validates read access on the commented-on item before creating', async () => {
			const service = new CommentsService({ schema, accountability });

			await service.createOne(validPayload);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ accountability, action: 'read', collection: 'articles', primaryKeys: ['1'] }),
				expect.objectContaining({ schema }),
			);
		});

		test('propagates a denied item access check and does not create', async () => {
			vi.mocked(validateAccess).mockRejectedValueOnce(new ForbiddenError());
			const service = new CommentsService({ schema, accountability });

			await expect(service.createOne(validPayload)).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
		});

		test('creates the comment and returns the new key', async () => {
			const service = new CommentsService({ schema, accountability });

			await expect(service.createOne(validPayload)).resolves.toBe(1);

			expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(validPayload, undefined);
		});

		test('does not look up users or notify when the comment has no mentions', async () => {
			const service = new CommentsService({ schema, accountability });

			await service.createOne(validPayload);

			expect(UsersService.prototype.readOne).not.toHaveBeenCalled();
			expect(NotificationsService.prototype.createOne).not.toHaveBeenCalled();
		});

		describe('mentions', () => {
			beforeEach(() => {
				vi.mocked(UsersService.prototype.readOne).mockImplementation(async (key: any) =>
					key === 'author-id'
						? { id: 'author-id', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' }
						: { id: key, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', role: { id: 'role-id' } },
				);

				vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([
					{ id: MENTIONED_USER, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com' },
				]);
			});

			test('notifies a mentioned user', async () => {
				const service = new CommentsService({ schema, accountability });

				await service.createOne({ ...validPayload, comment: `Hey @${MENTIONED_USER} look` });

				expect(NotificationsService.prototype.createOne).toHaveBeenCalledTimes(1);

				expect(NotificationsService.prototype.createOne).toHaveBeenCalledWith(
					expect.objectContaining({
						recipient: MENTIONED_USER,
						sender: 'author-id',
						collection: 'articles',
						item: '1',
						subject: 'You were mentioned in articles',
					}),
				);
			});

			test('renders the mention as the user name and links back to the item', async () => {
				const service = new CommentsService({ schema, accountability });

				await service.createOne({ ...validPayload, comment: `Hey @${MENTIONED_USER}` });

				const { message } = vi.mocked(NotificationsService.prototype.createOne).mock.calls[0]![0] as Notification;

				expect(message).toContain('<em>Alan Turing</em>');
				expect(message).not.toContain(MENTIONED_USER);
				expect(message).toContain('http://localhost:8055/admin/content/articles/1');
			});

			test('notifies a mentioned user only once when mentioned repeatedly', async () => {
				const service = new CommentsService({ schema, accountability });

				await service.createOne({
					...validPayload,
					comment: `@${MENTIONED_USER} and again @${MENTIONED_USER}`,
				});

				expect(NotificationsService.prototype.createOne).toHaveBeenCalledTimes(1);
			});

			test('notifies each distinct mentioned user', async () => {
				const service = new CommentsService({ schema, accountability });

				await service.createOne({ ...validPayload, comment: `@${MENTIONED_USER} @${OTHER_USER}` });

				expect(NotificationsService.prototype.createOne).toHaveBeenCalledTimes(2);
			});

			test('skips notifying a mentioned user who cannot read the item, without failing the comment', async () => {
				vi.mocked(validateAccess).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new ForbiddenError());

				const service = new CommentsService({ schema, accountability });

				await expect(service.createOne({ ...validPayload, comment: `Hey @${MENTIONED_USER}` })).resolves.toBe(1);

				expect(NotificationsService.prototype.createOne).not.toHaveBeenCalled();
				expect(useLogger().warn).toHaveBeenCalledWith(expect.stringContaining(MENTIONED_USER));
			});

			test('rethrows a non-forbidden failure raised while notifying', async () => {
				vi.mocked(validateAccess)
					.mockResolvedValueOnce(undefined)
					.mockRejectedValueOnce(new Error('database is on fire'));

				const service = new CommentsService({ schema, accountability });

				await expect(service.createOne({ ...validPayload, comment: `Hey @${MENTIONED_USER}` })).rejects.toThrow(
					'database is on fire',
				);
			});
		});
	});

	describe('updateMany', () => {
		test('rejects when accountability has no user, before mutating', async () => {
			const service = new CommentsService({ schema, accountability: anonymous });

			await expect(service.updateMany(['1'], { comment: 'edited by public' })).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('rejects changing user_created before mutating', async () => {
			const service = new CommentsService({ knex: db, schema, accountability });

			await expect(service.updateMany(['1'], { user_created: 'someone-else' })).rejects.toStrictEqual(
				new InvalidPayloadError({ reason: `You can't change the "user_created" value manually` }),
			);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});

		test('delegates to ItemsService.updateMany without an access check when the target is unchanged', async () => {
			const service = new CommentsService({ knex: db, schema, accountability });

			await service.updateMany(['1'], { comment: 'just the text' });

			expect(validateAccess).not.toHaveBeenCalled();
			expect(tracker.history.select).toHaveLength(0);

			expect(ItemsService.prototype.updateMany).toHaveBeenCalledWith(['1'], { comment: 'just the text' }, undefined);
		});

		test('validates the given pair without fetching when collection and item are both provided', async () => {
			const service = new CommentsService({ knex: db, schema, accountability });

			await service.updateMany(['1'], { collection: 'articles', item: '2' });

			expect(tracker.history.select).toHaveLength(0);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ accountability, action: 'read', collection: 'articles', primaryKeys: ['2'] }),
				expect.objectContaining({ schema }),
			);
		});

		test('fetches the missing collection and validates each one once when only item changes', async () => {
			tracker.on.select('directus_comments').response([
				{ collection: 'articles', item: '1' },
				{ collection: 'posts', item: '9' },
			]);

			const service = new CommentsService({ knex: db, schema, accountability });

			await service.updateMany(['1', '2'], { item: '5' });

			expect(validateAccess).toHaveBeenCalledTimes(2);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'read', collection: 'articles', primaryKeys: ['5'] }),
				expect.anything(),
			);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'read', collection: 'posts', primaryKeys: ['5'] }),
				expect.anything(),
			);
		});

		test('fetches the missing items and groups them under one call when only collection changes', async () => {
			tracker.on.select('directus_comments').response([
				{ collection: 'articles', item: '1' },
				{ collection: 'posts', item: '9' },
			]);

			const service = new CommentsService({ knex: db, schema, accountability });

			await service.updateMany(['1', '2'], { collection: 'reviews' });

			expect(validateAccess).toHaveBeenCalledTimes(1);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'read', collection: 'reviews', primaryKeys: ['1', '9'] }),
				expect.anything(),
			);
		});

		test('refuses to re-target a comment at an item the user cannot read', async () => {
			vi.mocked(validateAccess).mockRejectedValueOnce(new ForbiddenError());

			const service = new CommentsService({ knex: db, schema, accountability });

			await expect(service.updateMany(['1'], { collection: 'directus_users', item: 'admin-id' })).rejects.toThrow(
				ForbiddenError,
			);

			expect(ItemsService.prototype.updateMany).not.toHaveBeenCalled();
		});
	});

	describe('deleteMany', () => {
		test('rejects when accountability has no user, before mutating', async () => {
			const service = new CommentsService({ schema, accountability: anonymous });

			await expect(service.deleteMany(['1'])).rejects.toThrow(ForbiddenError);

			expect(ItemsService.prototype.deleteMany).not.toHaveBeenCalled();
		});

		test('delegates to ItemsService.deleteMany when a user is present', async () => {
			const service = new CommentsService({ knex: db, schema, accountability });

			await service.deleteMany(['1']);

			expect(ItemsService.prototype.deleteMany).toHaveBeenCalledWith(['1'], undefined);
		});
	});
});
