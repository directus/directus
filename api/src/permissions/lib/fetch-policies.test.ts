import type { Accountability } from '@directus/types';
import { beforeEach, expect, test, vi } from 'vitest';
import { AccessService } from '../../services/access.js';
import type { AccessRow } from '../modules/process-ast/types.js';
import type { Context } from '../types.js';
import { _fetchPolicies as fetchPolicies } from './fetch-policies.js';

vi.mock('../../services/access.js', () => ({
	AccessService: vi.fn(),
}));

let rows: AccessRow[];

beforeEach(() => {
	rows = [];

	AccessService.prototype.readByQuery = vi.fn().mockResolvedValue(rows);
});

test('Fetches policies for public role and user when user is given without role', async () => {
	const acc = { roles: [], user: 'user-a' } as unknown as Accountability;

	const policies = await fetchPolicies(acc, {} as Context);

	expect(AccessService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_or: [
				{ user: { _eq: 'user-a' } },
				{
					role: {
						_null: true,
					},
					user: {
						_null: true,
					},
				},
			],
		},
		fields: ['policy.id', 'policy.ip_access'],
		limit: -1,
	});

	expect(policies).toEqual([]);
});

test('Fetches policies for public role when no roles and user are given', async () => {
	const acc = { roles: [], user: null } as unknown as Accountability;

	const policies = await fetchPolicies(acc, {} as Context);

	expect(AccessService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			role: {
				_null: true,
			},
			user: {
				_null: true,
			},
		},
		fields: ['policy.id', 'policy.ip_access'],
		limit: -1,
	});

	expect(policies).toEqual([]);
});

test('Fetched policies for user roles', async () => {
	const acc = { roles: ['role-a', 'role-b'], user: null } as unknown as Accountability;

	const policies = await fetchPolicies(acc, {} as Context);

	expect(AccessService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			role: {
				_in: ['role-a', 'role-b'],
			},
		},
		fields: ['policy.id', 'policy.ip_access'],
		limit: -1,
	});

	expect(policies).toEqual([]);
});

test('Fetches policies for user roles and user if user is passed', async () => {
	const acc = { roles: ['role-a', 'role-b'], user: 'user-a' } as unknown as Accountability;

	const policies = await fetchPolicies(acc, {} as Context);

	expect(AccessService.prototype.readByQuery).toHaveBeenCalledWith({
		filter: {
			_or: [
				{
					user: {
						_eq: 'user-a',
					},
				},
				{
					role: {
						_in: ['role-a', 'role-b'],
					},
				},
			],
		},
		fields: ['policy.id', 'policy.ip_access'],
		limit: -1,
	});

	expect(policies).toEqual([]);
});

test('Filters policies based on ip access on access row', async () => {
	const acc = { roles: ['role-a', 'role-b'], user: 'user-a', ip: '127.0.0.5' } as unknown as Accountability;

	rows.push(
		{
			policy: {
				id: 'policy-a',
				ip_access: ['127.0.0.0/29'],
			},
		},
		{
			policy: {
				id: 'policy-b',
				ip_access: ['1.1.1.1/32'],
			},
		},
	);

	const policies = await fetchPolicies(acc, {} as Context);

	expect(policies).toEqual(['policy-a']);
});
