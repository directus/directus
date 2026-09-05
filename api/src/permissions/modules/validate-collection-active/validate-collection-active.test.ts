import { CollectionInactiveError, ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Context } from '../../types.js';
import { validateCollectionAccess } from '../validate-access/lib/validate-collection-access.js';
import { validateCollectionActive } from './validate-collection-active.js';

vi.mock('../validate-access/lib/validate-collection-access.js');

const context = (inactiveCollections?: string[]) =>
	({ schema: { inactiveCollections } as unknown as SchemaOverview, knex: {} }) as Context;

const accountability = (overrides: Partial<Accountability> = {}) =>
	({ user: 'user-id', role: 'role-id', admin: false, app: true, roles: [], ip: null, ...overrides }) as Accountability;

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(validateCollectionAccess).mockResolvedValue(false);
});

test('Resolves when the collection is active', async () => {
	await expect(
		validateCollectionActive(
			{ accountability: accountability(), action: 'read', collection: 'articles' },
			context(['archive']),
		),
	).resolves.toBeUndefined();

	expect(validateCollectionAccess).not.toHaveBeenCalled();
});

test('Resolves when the schema carries no inactive collections', async () => {
	await expect(
		validateCollectionActive({ accountability: accountability(), action: 'read', collection: 'archive' }, context()),
	).resolves.toBeUndefined();

	expect(validateCollectionAccess).not.toHaveBeenCalled();
});

test('Reports inactivity to an admin without checking permissions', async () => {
	await expect(
		validateCollectionActive(
			{ accountability: accountability({ admin: true }), action: 'read', collection: 'archive' },
			context(['archive']),
		),
	).rejects.toBeInstanceOf(CollectionInactiveError);

	expect(validateCollectionAccess).not.toHaveBeenCalled();
});

test('Reports inactivity to a non-admin holding permissions on the collection', async () => {
	vi.mocked(validateCollectionAccess).mockResolvedValue(true);

	await expect(
		validateCollectionActive(
			{ accountability: accountability(), action: 'update', collection: 'archive' },
			context(['archive']),
		),
	).rejects.toBeInstanceOf(CollectionInactiveError);
});

test('Hides inactivity from a non-admin without permissions on the collection', async () => {
	await expect(
		validateCollectionActive(
			{ accountability: accountability(), action: 'update', collection: 'archive' },
			context(['archive']),
		),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Reports inactivity without accountability, without checking permissions', async () => {
	await expect(
		validateCollectionActive({ accountability: null, action: 'read', collection: 'archive' }, context(['archive'])),
	).rejects.toBeInstanceOf(CollectionInactiveError);

	expect(validateCollectionAccess).not.toHaveBeenCalled();
});

test('Checks permissions for the requested collection and action', async () => {
	const auth = accountability();
	const ctx = context(['archive']);

	await expect(
		validateCollectionActive({ accountability: auth, action: 'delete', collection: 'archive' }, ctx),
	).rejects.toThrow();

	expect(validateCollectionAccess).toHaveBeenCalledWith(
		{ accountability: auth, action: 'delete', collection: 'archive' },
		ctx,
	);
});
