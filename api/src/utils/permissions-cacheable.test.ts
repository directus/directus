import { filterHasNow, permissionsCacheable } from './permissions-cacheable.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import type { Permission } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../permissions/lib/fetch-permissions.js');
vi.mock('../permissions/lib/fetch-policies.js');

describe('filterHasNow', () => {
	describe('has $NOW', () => {
		test('operator has $NOW', () => {
			const filter = {
				created_on: {
					_gt: '$NOW',
				},
			};

			expect(filterHasNow(filter)).toBe(true);
		});

		test('operator has $NOW function', () => {
			const filter = {
				created_on: {
					_gt: '$NOW(-1 year)',
				},
			};

			expect(filterHasNow(filter)).toBe(true);
		});

		test('_and has $NOW', () => {
			const filter = {
				_and: [
					{
						created_on: {
							_gt: '$NOW',
						},
					},
				],
			};

			expect(filterHasNow(filter)).toBe(true);
		});

		test('_and has $NOW', () => {
			const filter = {
				_or: [
					{
						created_on: {
							some: {
								_gt: '$NOW',
							},
						},
					},
				],
			};

			expect(filterHasNow(filter)).toBe(true);
		});

		test('has nested $NOW', () => {
			const filter = {
				_or: [
					{
						_and: [
							{ status: { _eq: 'archived' } },
							{
								metadata: {
									updated_at: { _lt: '$NOW' },
								},
							},
						],
					},
				],
			};

			expect(filterHasNow(filter)).toBe(true);
		});
	});

	describe('does not have $NOW', () => {
		test.each(['2021-01-01', null, false, true, '$CURRENT_USER'])('operator does not have $NOW', (value) => {
			const filter = {
				created_on: {
					_eq: value,
				},
			};

			expect(filterHasNow(filter)).toBe(false);
		});

		test('_in operator does not have $NOW', () => {
			const filter = {
				created_on: {
					_in: [1, 2],
				},
			};

			expect(filterHasNow(filter)).toBe(false);
		});

		test('_and does not have $NOW', () => {
			const filter = {
				_and: [
					{
						created_on: {
							_gt: '2021-01-01',
						},
					},
				],
			};

			expect(filterHasNow(filter)).toBe(false);
		});

		test('_or does not have $NOW', () => {
			const filter = {
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

			expect(filterHasNow(filter)).toBe(false);
		});
	});
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

	const result = await permissionsCacheable('items', {} as any, {} as any);

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

	const result = await permissionsCacheable('items', {} as any, {} as any);

	expect(result).toBe(true);
});
