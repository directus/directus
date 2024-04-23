import { expect, test } from 'vitest';
import type { AccessRow } from '../types.js';
import { filterPoliciesByIp } from './filter-policies-by-ip.js';

test('Keeps policies that do not have a ip access rule set configured when IP is null', () => {
	const policies: AccessRow[] = [
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: null,
				admin_access: false,
			},
		},
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: '127.0.0.1',
				admin_access: false,
			},
		},
	];

	const output = filterPoliciesByIp(policies, null);

	expect(output).toEqual([
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: null,
				admin_access: false,
			},
		},
	]);
});

test('Keeps policies that match the IP cidr block', () => {
	const policies: AccessRow[] = [
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: '192.168.1.0/22',
				admin_access: false,
			},
		},
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: '127.0.0.1',
				admin_access: false,
			},
		},
	];

	const output = filterPoliciesByIp(policies, '192.168.1.25');

	expect(output).toEqual([
		{
			role: 'test-role-a',
			user: null,
			sort: 1,
			policy: {
				id: 'test-policy-1',
				ip_access: '192.168.1.0/22',
				admin_access: false,
			},
		},
	]);
});
