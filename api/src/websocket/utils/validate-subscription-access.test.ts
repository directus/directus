import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Permission } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import type { Context } from '../../permissions/types.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { validateDeleteEventAccess, validateSubscriptionAccess } from './validate-subscription-access.js';

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn(),
}));

vi.mock('../../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn(async () => [{ permissions: null, fields: ['id'] }]),
}));

const SYSTEM_COLLECTIONS = ['directus_collections', 'directus_fields', 'directus_relations'];

const accountability = createDefaultAccountability({ user: 'a5e0e0b0-0000-4000-8000-000000000000' });

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.collection('languages', (c) => {
		c.field('code').string().primary();
	});

for (const collection of SYSTEM_COLLECTIONS) {
	schema.collection(collection, (c) => {
		c.field('id').id();
	});
}

const context = { knex: {} as Knex, schema: schema.build() } satisfies Context;

function permission(fields: string[] | null, rules: Permission['permissions'] = null) {
	return { fields, permissions: rules } as Permission;
}

const rowRule = permission(['id'], { owner: { _eq: '$CURRENT_USER' } });

afterEach(() => {
	vi.resetAllMocks();
});

describe.each([
	[
		'validateSubscriptionAccess',
		(accountability: Accountability | null) =>
			validateSubscriptionAccess({ accountability, collection: 'articles', event: 'delete' }, context),
	],
	[
		'validateDeleteEventAccess',
		(accountability: Accountability | null) =>
			validateDeleteEventAccess({ accountability, collection: 'articles', itemScoped: false }, context),
	],
] as const)('%s', (_name, validate) => {
	test.each([
		['access control is disabled', null],
		['admins', { ...accountability, admin: true }],
	])('skips validation when %s', async (_label, accountability) => {
		await validate(accountability);

		expect(validateAccess).not.toBeCalled();
		expect(fetchPermissions).not.toBeCalled();
	});
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

test.each(SYSTEM_COLLECTIONS)(
	'"%s" has no item level access control, so only the collection is validated and deletes are admin only',
	async (collection) => {
		await validateSubscriptionAccess({ accountability, collection, item: 'articles' }, context);

		expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection }, context);

		await expect(
			validateSubscriptionAccess({ accountability, collection, event: 'delete' }, context),
		).rejects.toBeInstanceOf(ForbiddenError);

		await expect(
			validateDeleteEventAccess({ accountability, collection, itemScoped: true }, context),
		).rejects.toBeInstanceOf(ForbiddenError);
	},
);

test('validates only the collection for create subscriptions, as the item may not exist yet', async () => {
	await validateSubscriptionAccess({ accountability, collection: 'articles', event: 'create', item: '5' }, context);

	expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection: 'articles' }, context);
});

test('validates the item for update subscriptions', async () => {
	await validateSubscriptionAccess({ accountability, collection: 'articles', event: 'update', item: '5' }, context);

	expect(validateAccess).toBeCalledWith(
		{ accountability, action: 'read', collection: 'articles', primaryKeys: ['5'] },
		context,
	);
});

test('propagates the error when access is denied', async () => {
	const error = new ForbiddenError();
	vi.mocked(validateAccess).mockRejectedValueOnce(error);

	await expect(validateSubscriptionAccess({ accountability, collection: 'articles' }, context)).rejects.toThrow(error);
});

test('skips the row rule check for item scoped delete subscriptions', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([rowRule]);

	await expect(
		validateSubscriptionAccess({ accountability, collection: 'articles', event: 'delete', item: '5' }, context),
	).resolves.toBeUndefined();
});

describe('delete rules', () => {
	function validate({ collection = 'articles', itemScoped = false } = {}) {
		return validateDeleteEventAccess({ accountability, collection, itemScoped }, context);
	}

	test.each([
		['an unrestricted permission', [permission(['*'])]],
		['one of several permissions', [permission(['title']), permission(['id'])]],
	])('allows collection wide deletes when %s can read the primary key', async (_label, permissions) => {
		vi.mocked(fetchPermissions).mockResolvedValueOnce(permissions);

		await expect(validate()).resolves.toBeUndefined();
	});

	test('rejects collection wide deletes when any read permission has row rules', async () => {
		vi.mocked(fetchPermissions).mockResolvedValueOnce([rowRule, permission(['*'])]);

		await expect(validate()).rejects.toBeInstanceOf(ForbiddenError);
	});

	test('rejects item scoped deletes without read access to the primary key', async () => {
		vi.mocked(fetchPermissions).mockResolvedValueOnce([permission(['title']), permission(null)]);

		await expect(validate({ itemScoped: true })).rejects.toBeInstanceOf(ForbiddenError);
	});

	test('checks read access to the primary key of the collection rather than an "id" field', async () => {
		vi.mocked(fetchPermissions).mockResolvedValueOnce([permission(['id'])]);
		await expect(validate({ collection: 'languages' })).rejects.toBeInstanceOf(ForbiddenError);

		vi.mocked(fetchPermissions).mockResolvedValueOnce([permission(['code'])]);
		await expect(validate({ collection: 'languages' })).resolves.toBeUndefined();
	});

	test('does not re-validate the deleted item on dispatch', async () => {
		await validate({ itemScoped: true });

		expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection: 'articles' }, context);
	});
});
