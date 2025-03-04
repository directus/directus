import type { Filter, Permission } from '@directus/types';
import { expect, test, vi } from 'vitest';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { filter_has_now, permissionsCachable } from './permissions-cachable.js';

vi.mock('../permissions/lib/fetch-permissions.js');
vi.mock('../permissions/lib/fetch-policies.js');

test('filter has $NOW', () => {
	let filter: Filter = {
		created_on: {
			_gt: '$NOW',
		},
	};

	expect(filter_has_now(filter)).toBe(true);

	filter = {
		_and: [
			{
				created_on: {
					_gt: '$NOW',
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(true);

	filter = {
		_or: [
			{
				created_on: {
					some: {
						_gt: '$NOW(-1 year)',
					},
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(true);
});

test('filter does not have $NOW', () => {
	let filter: Filter = {
		created_on: {
			_gt: '2021-01-01',
		},
	};

	expect(filter_has_now(filter)).toBe(false);

	filter = {
		_and: [
			{
				created_on: {
					_gt: '2021-01-01',
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(false);

	filter = {
		_or: [
			{
				created_on: {
					some: {
						_gt: '2021-01-01',
					},
				},
			},
		],
	};

	expect(filter_has_now(filter)).toBe(false);
});

test('permissions are not cacheable on many policies with $NOW', async () => {
	vi.mocked(fetchPolicies).mockResolvedValue(['policy1', 'policy2', 'policy3']);

	const permissions: Permission[] = [
		{
			action: 'read',
			collection: 'items',
			fields: ['*'],
			permissions: {
				created_on: {
					_gt: '2021-01-01',
				},
			},
			policy: 'policy1',
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'items',
			fields: ['*'],
			permissions: {
				created_on: {
					_gt: '$NOW',
				},
			},
			policy: 'policy1',
			presets: [],
			validation: null,
		},
	];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await permissionsCachable('items', {} as any, {} as any);

	expect(result).toBe(false);
});

test('permissions are cacheable on many policies without $NOW', async () => {
	vi.mocked(fetchPolicies).mockResolvedValue(['policy1', 'policy2', 'policy3']);

	const permissions: Permission[] = [
		{
			action: 'read',
			collection: 'items',
			fields: ['*'],
			permissions: {
				created_on: {
					_gt: '2021-01-01',
				},
			},
			policy: 'policy1',
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'items',
			fields: ['*'],
			permissions: {
				created_on: {
					_gt: '2021-01-01',
				},
			},
			policy: 'policy1',
			presets: [],
			validation: null,
		},
	];

	vi.mocked(fetchPermissions).mockResolvedValue(permissions);

	const result = await permissionsCachable('items', {} as any, {} as any);

	expect(result).toBe(true);
});
