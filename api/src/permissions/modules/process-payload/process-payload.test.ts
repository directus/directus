import { ForbiddenError } from '@directus/errors';
import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { FailedValidationError } from '@directus/validation';
import { expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import type { Context } from '../../types.js';
import { processPayload } from './process-payload.js';

vi.mock('../../lib/fetch-permissions.js');
vi.mock('../../lib/fetch-policies.js');

vi.mock('../../../services/permissions.js', () => ({
	PermissionsService: vi.fn(),
}));

vi.mock('../../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

test('Returns early when admin', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: true } as unknown as Accountability;

	await expect(
		processPayload(
			{
				collection: 'collection-a',
				action: 'read',
				accountability: acc,
				payload: {},
			},
			{ schema } as Context,
		),
	).resolves.toEqual({});
});

test('Throws forbidden error when permissions length is 0', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([]);

	await expect(
		processPayload({ accountability: acc, action: 'read', collection: 'collection-a', payload: {} }, {
			schema,
		} as Context),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Throws forbidden error if used fields contain field that has no permission', async () => {
	const schema = {} as unknown as SchemaOverview;
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
			},
			{ schema } as Context,
		),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Validates against field validation rules', async () => {
	const schema = {
		collections: {
			'collection-a': {
				fields: {
					'field-a': {
						validation: {
							'field-a': {
								_eq: 1,
							},
						},
					},
				},
			},
		},
	} as unknown as SchemaOverview;

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([{ fields: ['field-a'] } as Permission]);

	try {
		await processPayload(
			{
				accountability: acc,
				action: 'read',
				collection: 'collection-a',
				payload: {
					'field-a': 2,
				},
			},
			{ schema } as Context,
		);
	} catch (errors: any) {
		expect(errors.length).toBe(1);
		expect(errors[0]).toBeInstanceOf(FailedValidationError);
	}
});

test('Validates against permission validation rules', async () => {
	const schema = { collections: { 'collection-a': { fields: {} } } } as unknown as SchemaOverview;

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
			},
			{ schema } as Context,
		);
	} catch (errors: any) {
		expect(errors.length).toBe(1);
		expect(errors[0]).toBeInstanceOf(FailedValidationError);
	}
});

test('Merges and applies defaults from presets', async () => {
	const schema = { collections: { 'collection-a': { fields: {} } } } as unknown as SchemaOverview;

	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([
		{ fields: ['field-a'], validation: null, presets: { 'field-b': 1 } } as unknown as Permission,
		{ fields: ['field-a', 'field-b'], validation: null, presets: { 'field-c': 2 } } as unknown as Permission,
		{ fields: ['*'], presets: { 'field-b': 3 } } as unknown as Permission,
	]);

	const payloadWithPresets = await processPayload(
		{
			accountability: acc,
			action: 'read',
			collection: 'collection-a',
			payload: {
				'field-a': 2,
			},
		},
		{ schema } as Context,
	);

	expect(payloadWithPresets).toEqual({
		'field-a': 2,
		'field-b': 3,
		'field-c': 2,
	});
});
