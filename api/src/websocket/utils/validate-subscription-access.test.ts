import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import type { Context } from '../../permissions/types.js';
import { validateDeleteEventAccess, validateSubscriptionAccess } from './validate-subscription-access.js';

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([{ permissions: null }]),
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

const rowRule = { permissions: { owner: { _eq: '$CURRENT_USER' } } } as any;

afterEach(() => {
	vi.clearAllMocks();
});

test('skips validation when access control is disabled', async () => {
	await validateSubscriptionAccess({ accountability: null, collection: 'articles' }, context);

	expect(validateAccess).not.toBeCalled();
});

test('skips validation for admins', async () => {
	await validateSubscriptionAccess(
		{ accountability: { ...accountability, admin: true }, collection: 'articles' },
		context,
	);

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

describe('delete rules', () => {
	describe.each([
		[
			'validateSubscriptionAccess',
			(item?: string) =>
				validateSubscriptionAccess({ accountability, collection: 'articles', event: 'delete', item }, context),
		],
		[
			'validateDeleteEventAccess',
			(item?: string) =>
				validateDeleteEventAccess({ accountability, collection: 'articles', itemScoped: item !== undefined }, context),
		],
	] as const)('%s', (_name, validate) => {
		test('allows collection wide deletes with unrestricted read access', async () => {
			await expect(validate()).resolves.toBeUndefined();
		});

		test('rejects collection wide deletes when every read permission has row rules', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([rowRule]);

			await expect(validate()).rejects.toBeInstanceOf(ForbiddenError);
		});

		test('allows collection wide deletes when any read permission is unrestricted', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([rowRule, { permissions: {} } as any]);

			await expect(validate()).resolves.toBeUndefined();
		});

		test('skips the row rule check for item scoped deletes', async () => {
			await expect(validate('5')).resolves.toBeUndefined();
			expect(fetchPermissions).not.toBeCalled();
		});
	});

	describe.each(['directus_collections', 'directus_fields', 'directus_relations'])('"%s"', (collection) => {
		test('rejects deletes for non-admins', async () => {
			await expect(
				validateSubscriptionAccess({ accountability, collection, event: 'delete' }, context),
			).rejects.toBeInstanceOf(ForbiddenError);

			await expect(
				validateDeleteEventAccess({ accountability, collection, itemScoped: true }, context),
			).rejects.toBeInstanceOf(ForbiddenError);
		});

		test('allows deletes for admins', async () => {
			await expect(
				validateDeleteEventAccess(
					{ accountability: { ...accountability, admin: true }, collection, itemScoped: false },
					context,
				),
			).resolves.toBeUndefined();
		});
	});

	test('does not re-validate the deleted item on dispatch', async () => {
		await validateDeleteEventAccess({ accountability, collection: 'articles', itemScoped: true }, context);

		expect(validateAccess).toBeCalledWith({ accountability, action: 'read', collection: 'articles' }, context);
	});
});
