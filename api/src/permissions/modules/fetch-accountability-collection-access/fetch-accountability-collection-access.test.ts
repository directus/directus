import { fetchAccountabilityCollectionAccess } from './fetch-accountability-collection-access.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Permission } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../lib/fetch-policies.js');
vi.mock('../../lib/fetch-permissions.js');

beforeEach(() => {
	vi.clearAllMocks();

	vi.mocked(fetchPolicies).mockResolvedValue([]);
});

test('Returns all permissions for all collections if admin', async () => {
	const schema = new SchemaBuilder()
		.collection('collection-a', (c) => {
			c.field('id').id();
		})
		.collection('collection-b', (c) => {
			c.field('id').id();
		})
		.build();

	const result = await fetchAccountabilityCollectionAccess(
		{ admin: true } as unknown as Accountability,
		{ schema } as unknown as Context,
	);

	expect(result).toEqual({
		'collection-a': {
			create: { access: 'full', fields: ['*'] },
			read: { access: 'full', fields: ['*'] },
			update: { access: 'full', fields: ['*'] },
			delete: { access: 'full', fields: ['*'] },
			share: { access: 'full', fields: ['*'] },
		},
		'collection-b': {
			create: { access: 'full', fields: ['*'] },
			read: { access: 'full', fields: ['*'] },
			update: { access: 'full', fields: ['*'] },
			delete: { access: 'full', fields: ['*'] },
			share: { access: 'full', fields: ['*'] },
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
			create: { access: 'none' },
			read: { access: 'full', fields: ['field-a', 'field-b'] },
			update: { access: 'none' },
			delete: { access: 'none' },
			share: { access: 'none' },
		},
		'collection-b': {
			create: { access: 'none' },
			read: { access: 'none' },
			update: { access: 'full', fields: ['field-c'] },
			delete: { access: 'none' },
			share: { access: 'none' },
		},
	});
});

test('Returns permissions with partial access if permissions have filters', async () => {
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
			create: { access: 'none' },
			read: {
				access: 'partial',
				fields: ['field-a', 'field-b'],
			},
			update: { access: 'none' },
			delete: { access: 'none' },
			share: { access: 'none' },
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
			create: { access: 'none' },
			read: { access: 'full', fields: ['*'] },
			update: { access: 'none' },
			delete: { access: 'none' },
			share: { access: 'none' },
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
			create: { access: 'none' },
			read: { access: 'full', fields: ['*'], presets: { 'field-a': 3, 'field-b': 2, 'field-c': 4 } },
			update: { access: 'none' },
			delete: { access: 'none' },
			share: { access: 'none' },
		},
	});
});
