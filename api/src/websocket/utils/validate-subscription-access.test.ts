import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import type { Context } from '../../permissions/types.js';
import { validateSubscriptionAccess } from './validate-subscription-access.js';

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

const accountability = {
	role: null,
	user: 'a5e0e0b0-0000-4000-8000-000000000000',
	roles: [],
	admin: false,
	app: false,
	ip: null,
} satisfies Accountability;

const context = { knex: {} as Knex, schema: {} as SchemaOverview } satisfies Context;

afterEach(() => {
	vi.clearAllMocks();
});

test('skips validation when access control is disabled', async () => {
	await validateSubscriptionAccess({ accountability: null, collection: 'articles' }, context);

	expect(validateAccess).not.toBeCalled();
});

test('validates read access to the collection', async () => {
	await validateSubscriptionAccess({ accountability, collection: 'articles' }, context);

	expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection: 'articles' }, context);
});

test('validates read access to the item for item scoped subscriptions', async () => {
	await validateSubscriptionAccess({ accountability, collection: 'articles', item: '5' }, context);

	expect(validateAccess).toBeCalledWith(
		{ accountability, action: 'read', collection: 'articles', primaryKeys: ['5'] },
		context,
	);
});

describe.each(['directus_collections', 'directus_fields', 'directus_relations'])(
	'"%s" has no item level access control',
	(collection) => {
		test('so only the collection is validated', async () => {
			await validateSubscriptionAccess({ accountability, collection, item: 'articles' }, context);

			expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection }, context);
		});
	},
);

test('propagates the error when access is denied', async () => {
	const error = new ForbiddenError();
	vi.mocked(validateAccess).mockRejectedValueOnce(error);

	await expect(validateSubscriptionAccess({ accountability, collection: 'articles' }, context)).rejects.toThrow(error);
});
