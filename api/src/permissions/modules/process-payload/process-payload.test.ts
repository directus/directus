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
		processPayload(accessService, permissionsService, schema, acc, 'read', 'collection-a', {}),
	).resolves.toBeUndefined();
});

test('Throws forbidden error when permissions length is 0', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([]);

	await expect(
		processPayload(accessService, permissionsService, schema, acc, 'read', 'collection-a', {}),
	).rejects.toBeInstanceOf(ForbiddenError);
});

test('Throws forbidden error if used fields contain field that has no permission', async () => {
	const schema = {} as unknown as SchemaOverview;
	const acc = { admin: false } as unknown as Accountability;

	vi.mocked(fetchPermissions).mockResolvedValue([{ fields: ['field-a'] } as Permission]);

	await expect(
		processPayload(accessService, permissionsService, schema, acc, 'read', 'collection-a', {
			'field-b': 'x',
		}),
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
		await processPayload(accessService, permissionsService, schema, acc, 'read', 'collection-a', {
			'field-a': 2,
		});
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
		await processPayload(accessService, permissionsService, schema, acc, 'read', 'collection-a', {
			'field-a': 2,
		});
	} catch (errors: any) {
		expect(errors.length).toBe(1);
		expect(errors[0]).toBeInstanceOf(FailedValidationError);
	}
});
