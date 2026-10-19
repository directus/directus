import { ForbiddenError } from '@directus/errors';
import type { Accountability, Relation, SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchAllowedFields } from '../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { RelationsService } from '../../services/index.js';
import { getPayload, getRelationsPayload } from './items.js';

vi.mock('../../services/index.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	const { ItemsService } = mockItemsService();

	ItemsService.prototype.readAll = vi.fn().mockResolvedValue([]);

	return { RelationsService: ItemsService, CollectionsService: vi.fn(), FieldsService: vi.fn(), MetaService: vi.fn() };
});

vi.mock('../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js', () => ({
	fetchAllowedFields: vi.fn(),
}));

const accountability = {
	role: null,
	user: 'a5e0e0b0-0000-4000-8000-000000000000',
	roles: [],
	admin: false,
	app: true,
	ip: null,
} satisfies Accountability;

const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

const relation = (id: number) => ({ collection: 'articles', field: 'author', meta: { id } }) as unknown as Relation;

afterEach(() => {
	vi.clearAllMocks();
	vi.mocked(RelationsService.prototype.readAll).mockReset().mockResolvedValue([]);
});

test('getPayload reads directus_relations events through the RelationsService', async () => {
	vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(2)]);

	const result = await getPayload({ collection: 'directus_relations' }, accountability, schema, {
		action: 'create',
		collection: 'directus_relations',
		key: 2,
		payload: { many_collection: 'secrets' },
	});

	expect(result['data']).toEqual([relation(2)]);
});

describe('getRelationsPayload', () => {
	test('reads the initial payload through the RelationsService', async () => {
		vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(1)]);

		const result = await getRelationsPayload(accountability, schema);

		expect(RelationsService).toBeCalledWith(expect.objectContaining({ accountability }));
		expect(result).toEqual([relation(1)]);
	});

	test('returns created relations the user can read instead of the event payload', async () => {
		vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(1), relation(2)]);

		const result = await getRelationsPayload(accountability, schema, {
			action: 'create',
			collection: 'directus_relations',
			key: 2,
			payload: { many_collection: 'secrets' },
		});

		expect(result).toEqual([relation(2)]);
	});

	test('returns nothing for updated relations the user cannot read', async () => {
		// readAll only returns the relations on collections and fields the user can read
		vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(1)]);

		const result = await getRelationsPayload(accountability, schema, {
			action: 'update',
			collection: 'directus_relations',
			keys: [2],
			payload: { one_deselect_action: 'delete' },
		});

		expect(result).toEqual([]);
	});

	describe('delete events', () => {
		const deleteEvent = {
			action: 'delete',
			collection: 'directus_relations',
			keys: ['author'],
			payload: { collection: 'articles', fields: ['author'] },
		} as const;

		test('returns the deleted relation when the user can read its field', async () => {
			vi.mocked(fetchAllowedFields).mockResolvedValueOnce(['id', 'author']);

			const result = await getRelationsPayload(accountability, schema, { ...deleteEvent, keys: ['author'] });

			expect(fetchAllowedFields).toBeCalledWith(
				{ collection: 'articles', action: 'read', accountability },
				expect.anything(),
			);

			expect(result).toEqual(deleteEvent.payload);
		});

		test('rejects the deleted relation when the user cannot read its field', async () => {
			vi.mocked(fetchAllowedFields).mockResolvedValueOnce(['id']);

			await expect(
				getRelationsPayload(accountability, schema, { ...deleteEvent, keys: ['author'] }),
			).rejects.toBeInstanceOf(ForbiddenError);
		});

		test('returns the deleted relation for admins', async () => {
			const result = await getRelationsPayload({ ...accountability, admin: true }, schema, {
				...deleteEvent,
				keys: ['author'],
			});

			expect(fetchAllowedFields).not.toBeCalled();
			expect(result).toEqual(deleteEvent.payload);
		});
	});
});
