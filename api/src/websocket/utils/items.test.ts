import { SchemaBuilder } from '@directus/schema-builder';
import type { Relation } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { RelationsService } from '../../services/index.js';
import { getPayload, getRelationsPayload } from './items.js';

vi.mock('../../services/index.js', async () => {
	const { mockRelationsService } = await import('../../test-utils/services/relations-service.js');
	return { ...mockRelationsService(), CollectionsService: vi.fn(), FieldsService: vi.fn(), MetaService: vi.fn() };
});

const accountability = createDefaultAccountability({ user: 'a5e0e0b0-0000-4000-8000-000000000000', app: true });

const schema = new SchemaBuilder().build();

const relation = (id: number) => ({ collection: 'articles', field: 'author', meta: { id } }) as unknown as Relation;

afterEach(() => {
	vi.resetAllMocks();
});

test('getPayload reads directus_relations subscriptions through the RelationsService', async () => {
	vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(1)]);

	const result = await getPayload({ collection: 'directus_relations' }, accountability, schema);

	expect(result).toEqual({ event: 'init', data: [relation(1)] });
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
			key: '2',
			payload: { many_collection: 'secrets' },
		});

		expect(result).toEqual([relation(2)]);
	});

	test('returns updated relations the user can read', async () => {
		vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([relation(1), relation(2), relation(3)]);

		const result = await getRelationsPayload(accountability, schema, {
			action: 'update',
			collection: 'directus_relations',
			keys: [1, 3],
			payload: { one_deselect_action: 'delete' },
		});

		expect(result).toEqual([relation(1), relation(3)]);
	});

	test('skips relations without meta, as they have no id to match the event against', async () => {
		const withoutMeta = { collection: 'articles', field: 'editor', meta: null } as unknown as Relation;
		vi.mocked(RelationsService.prototype.readAll).mockResolvedValueOnce([withoutMeta, relation(2)]);

		const result = await getRelationsPayload(accountability, schema, {
			action: 'create',
			collection: 'directus_relations',
			key: 2,
			payload: {},
		});

		expect(result).toEqual([relation(2)]);
	});

	test('returns the event payload for delete events, which are only dispatched to admins', async () => {
		const payload = { collection: 'articles', fields: ['author'] };

		const result = await getRelationsPayload(accountability, schema, {
			action: 'delete',
			collection: 'directus_relations',
			keys: ['author'],
			payload,
		});

		expect(result).toBe(payload);
		expect(RelationsService.prototype.readAll).not.toBeCalled();
	});
});
