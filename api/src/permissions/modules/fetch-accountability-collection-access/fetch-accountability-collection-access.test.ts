import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import { vi, test, beforeEach, expect } from 'vitest';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { fetchAccountabilityCollectionAccess } from './fetch-accountability-collection-access.js';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchPolicies).mockResolvedValue([]);
});

test('Returns all permissions for all collections if admin', async () => {
	const schema = {
		collections: {
			'collection-a': {},
			'collection-b': {},
		},
	} as unknown as SchemaOverview;

	const result = await fetchAccountabilityCollectionAccess(
		{ admin: true } as unknown as Accountability,
		{ schema } as unknown as Context,
	);

	expect(result).toEqual({
		'collection-a': {
			create: { access: true, full_access: true, fields: ['*'] },
			read: { access: true, full_access: true, fields: ['*'] },
			update: { access: true, full_access: true, fields: ['*'] },
			delete: { access: true, full_access: true, fields: ['*'] },
			share: { access: true, full_access: true, fields: ['*'] },
		},
		'collection-b': {
			create: { access: true, full_access: true, fields: ['*'] },
			read: { access: true, full_access: true, fields: ['*'] },
			update: { access: true, full_access: true, fields: ['*'] },
			delete: { access: true, full_access: true, fields: ['*'] },
			share: { access: true, full_access: true, fields: ['*'] },
		},
	});
});

test('Returns permissions for collections for accountability if not admin', async () => {
	const permissions = [
		{ collection: 'collection-a', action: 'read', fields: ['field-a', 'field-b'] },
		{ collection: 'collection-b', action: 'update', fields: ['field-c'], permissions: {} },
	] as unknown as Permission[];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await fetchAccountabilityCollectionAccess({} as unknown as Accountability, {} as unknown as Context);

	expect(result).toEqual({
		'collection-a': {
			read: {
				access: true,
				full_access: true,
				fields: ['field-a', 'field-b'],
			},
		},
		'collection-b': {
			update: {
				access: true,
				full_access: true,
				fields: ['field-c'],
			},
		},
	});
});

test('Returns permissions with full_access false if permissions have filters', async () => {
	const permissions = [
		{
			collection: 'collection-a',
			action: 'read',
			fields: ['field-a', 'field-b'],
			permissions: {
				'field-a': {},
			},
		},
	] as unknown as Permission[];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await fetchAccountabilityCollectionAccess({} as unknown as Accountability, {} as unknown as Context);

	expect(result).toEqual({
		'collection-a': {
			read: {
				access: true,
				full_access: false,
				fields: ['field-a', 'field-b'],
			},
		},
	});
});

test('Returns fields with * if any permission has *', async () => {
	const permissions = [
		{ collection: 'collection-a', action: 'read', fields: ['field-a', 'field-b'] },
		{ collection: 'collection-a', action: 'read', fields: ['*'] },
	] as unknown as Permission[];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await fetchAccountabilityCollectionAccess({} as unknown as Accountability, {} as unknown as Context);

	expect(result).toEqual({
		'collection-a': {
			read: {
				access: true,
				full_access: true,
				fields: ['*'],
			},
		},
	});
});

test('Returns combined presets', async () => {
	const permissions = [
		{
			collection: 'collection-a',
			action: 'read',
			fields: ['field-a', 'field-b'],
			presets: { 'field-a': 1, 'field-b': 2 },
		},
		{ collection: 'collection-a', action: 'read', fields: ['*'], presets: { 'field-a': 3, 'field-c': 4 } },
	] as unknown as Permission[];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await fetchAccountabilityCollectionAccess({} as unknown as Accountability, {} as unknown as Context);

	expect(result).toEqual({
		'collection-a': {
			read: {
				access: true,
				full_access: true,
				fields: ['*'],
				presets: { 'field-a': 3, 'field-b': 2, 'field-c': 4 },
			},
		},
	});
});
