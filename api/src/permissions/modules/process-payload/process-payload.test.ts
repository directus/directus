import { ForbiddenError } from '@directus/errors';
import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { FailedValidationError } from '@directus/validation';
import { beforeEach, expect, test, vi } from 'vitest';
import type { AccessService } from '../../../services/access.js';
import type { PermissionsService } from '../../../services/index.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { processPayload } from './process-payload.js';

vi.mock('../../lib/fetch-permissions.js');
vi.mock('../../lib/fetch-policies.js');

let accessService: AccessService;
let permissionsService: PermissionsService;

beforeEach(() => {
	accessService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as AccessService;

	permissionsService = {
		readByQuery: vi.fn().mockResolvedValue([]),
	} as unknown as PermissionsService;
});

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
			{
				accessService,
				permissionsService,
				schema,
			},
		),
	).resolves.toEqual({});
});

test('Throws forbidden error when permissions length is 0', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([]);

	await expect(
		processPayload(
			{ accountability: acc, action: 'read', collection: 'collection-a', payload: {} },
			{
				accessService,
				permissionsService,
				schema,
			},
		),
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
			{
				accessService,
				permissionsService,
				schema,
			},
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
			{ accessService, permissionsService, schema },
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
			{ accessService, permissionsService, schema },
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
		{
			accessService,
			permissionsService,
			schema,
		},
	);

	expect(payloadWithPresets).toEqual({
		'field-a': 2,
		'field-b': 3,
		'field-c': 2,
	});
});
