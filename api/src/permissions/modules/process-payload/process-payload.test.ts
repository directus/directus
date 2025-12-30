import { isFieldNullable } from './lib/is-field-nullable.js';
import { processPayload } from './process-payload.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { ForbiddenError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Permission, PermissionsAction } from '@directus/types';
import { FailedValidationError } from '@directus/validation';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../lib/fetch-permissions.js');
vi.mock('../../lib/fetch-policies.js');
vi.mock('./lib/is-field-nullable.js');
vi.mock('../../utils/fetch-dynamic-variable-data.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

beforeEach(() => {
	vi.mocked(isFieldNullable).mockReturnValue(true);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Skips permission checks when admin', async () => {
	const payload = {};

	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('id').id();
		})
		.build();

	const acc = { admin: true } as unknown as Accountability;

	await expect(
		processPayload(
			{
				collection: 'collection-a',
				action: 'read',
				accountability: acc,
				payload,
				nested: [],
			},
			{ schema } as Context,
		),
	).resolves.toEqual(payload);

	expect(fetchPolicies).toHaveBeenCalledTimes(0);
	expect(fetchPermissions).toHaveBeenCalledTimes(0);
});

test('Throws forbidden error when permissions length is 0', async () => {
	const schema = new SchemaBuilder().build();
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([]);

	await expect(
		processPayload({ accountability: acc, action: 'read', collection: 'collection-a', payload: {}, nested: [] }, {
			schema,
		} as Context),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Throws forbidden error if used fields contain field that has no permission', async () => {
	const schema = new SchemaBuilder().build();
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([{ fields: ['field-a'] } as Permission]);

	await expect(
		processPayload(
			{
				accountability: acc,
				action: 'read',
				collection: 'collection-a',
				payload: {
					'field-b': 'x',
				},
				nested: [],
			},
			{ schema } as Context,
		),
	).rejects.toBeInstanceOf(ForbiddenError);
});

describe('Validates against field validation rules', () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a')
				.id()
				.options({
					validation: {
						'field-a': {
							_eq: 1,
						},
					},
				});
		})
		.build();

	const users = [
		{ user: 'admin', admin: true },
		{ user: 'non-admin', admin: false },
	];

	test.each(users)('$user user', async ({ admin }) => {
		const acc = { admin } as unknown as Accountability;

		vi.mocked(fetchPermissions).mockResolvedValue([{ fields: ['field-a'], validation: null } as Permission]);

		expect.assertions(2);

		try {
			await processPayload(
				{
					accountability: acc,
					action: 'read',
					collection: 'collection-a',
					payload: {
						'field-a': 2,
					},
					nested: [],
				},
				{ schema } as Context,
			);
		} catch (errors: any) {
			expect(errors.length).toBe(1);
			expect(errors[0]).toBeInstanceOf(FailedValidationError);
		}
	});
});

describe('Injects and validates rules for non-nullable fields', () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').integer().primary();
		})
		.build();

	const users = [
		{ user: 'admin', admin: true },
		{ user: 'non-admin', admin: false },
	];

	const actions: { action: PermissionsAction }[] = [{ action: 'read' }, { action: 'create' }];

	describe.each(users)('$user user', async ({ admin }) => {
		const acc = { admin } as unknown as Accountability;

		test.each(actions)('$action action', async ({ action }) => {
			vi.mocked(isFieldNullable).mockReturnValue(false);
			vi.mocked(fetchPermissions).mockResolvedValue([{ fields: ['field-a'], validation: null } as Permission]);

			expect.assertions(2);

			try {
				await processPayload(
					{
						accountability: acc,
						action,
						collection: 'collection-a',
						payload: action === 'create' ? {} : { 'field-a': null },
						nested: [],
					},
					{ schema } as Context,
				);
			} catch (errors: any) {
				expect(errors.length).toBe(1);
				expect(errors[0]).toBeInstanceOf(FailedValidationError);
			}
		});
	});
});

test('Validates against permission validation rules', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').integer().primary();
		})
		.build();

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ fields: ['field-a'], validation: { 'field-a': { _eq: 1 } } } as unknown as Permission,
	]);

	try {
		await processPayload(
			{
				accountability: acc,
				action: 'read',
				collection: 'collection-a',
				payload: {
					'field-a': 2,
				},
				nested: [],
			},
			{ schema } as Context,
		);

		expect(true).toBe(false);
	} catch (errors: any) {
		expect(errors.length).toBe(1);
		expect(errors[0]).toBeInstanceOf(FailedValidationError);
	}
});

test('Validates against permission and field validation rules', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a')
				.id()
				.options({
					validation: {
						'field-a': {
							_eq: 1,
						},
					},
				});
		})
		.build();

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ fields: ['field-a'], validation: { 'field-a': { _eq: 2 } } } as unknown as Permission,
	]);

	try {
		await processPayload(
			{
				accountability: acc,
				action: 'read',
				collection: 'collection-a',
				payload: {
					'field-a': 3,
				},
				nested: [],
			},
			{ schema } as Context,
		);

		expect(true).toBe(false);
	} catch (errors: any) {
		expect(errors.length).toBe(2);
		expect(errors[0]).toBeInstanceOf(FailedValidationError);
		expect(errors[1]).toBeInstanceOf(FailedValidationError);
	}
});

test('Merges and applies defaults from presets', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ fields: ['field-a'], validation: null, presets: { 'field-b': 1 } } as unknown as Permission,
		{ fields: ['field-a', 'field-b'], validation: null, presets: { 'field-c': 2 } } as unknown as Permission,
		{ fields: ['*'], validation: null, presets: { 'field-b': 3 } } as unknown as Permission,
	]);

	const payloadWithPresets = await processPayload(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			payload: {
				'field-a': 2,
			},
			nested: [],
		},
		{ schema } as Context,
	);

	expect(payloadWithPresets).toEqual({
		'field-a': 2,
		'field-b': 3,
		'field-c': 2,
	});
});

test('Checks validation rules against payload with defaults', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('field-a').id();
		})
		.build();

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ fields: ['field-a'], validation: { 'field-a': { _eq: 2 } }, presets: { 'field-a': 1 } } as unknown as Permission,
		{ fields: [], validation: null, presets: { 'field-a': 2 } } as unknown as Permission,
	]);

	const payloadWithPresets = await processPayload(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			payload: {},
			nested: [],
		},
		{ schema } as Context,
	);

	expect(payloadWithPresets).toEqual({
		'field-a': 2,
	});
});
