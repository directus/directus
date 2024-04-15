import { expect, test } from 'vitest';
import type { AccessRow } from '../types.js';
import { orderPoliciesByPriority } from './order-policies-by-priority.js';

const roles = ['test-role-a', 'test-role-b', 'test-role-c'];

const ar1: AccessRow = {
	role: null,
	user: null,
	sort: 1,
	policy: {
		id: 'test-policy-1',
		admin_access: false,
		ip_access: null,
	},
};

const ar2: AccessRow = {
	role: null,
	user: null,
	sort: 2,
	policy: {
		id: 'test-policy-2',
		admin_access: false,
		ip_access: null,
	},
};

const ar3: AccessRow = {
	role: 'test-role-a',
	user: null,
	sort: 1,
	policy: {
		id: 'test-policy-3',
		admin_access: false,
		ip_access: null,
	},
};

const ar4: AccessRow = {
	role: 'test-role-a',
	user: null,
	sort: 2,
	policy: {
		id: 'test-policy-4',
		admin_access: false,
		ip_access: null,
	},
};

const ar5: AccessRow = {
	role: 'test-role-b',
	user: null,
	sort: 1,
	policy: {
		id: 'test-policy-5',
		admin_access: false,
		ip_access: null,
	},
};

const ar6: AccessRow = {
	role: 'test-role-c',
	user: null,
	sort: 1,
	policy: {
		id: 'test-policy-6',
		admin_access: false,
		ip_access: null,
	},
};

const ar7: AccessRow = {
	role: null,
	user: 'test-user-a',
	sort: 1,
	policy: {
		id: 'test-policy-7',
		admin_access: false,
		ip_access: null,
	},
};

const ar8: AccessRow = {
	role: null,
	user: 'test-user-a',
	sort: 2,
	policy: {
		id: 'test-policy-8',
		admin_access: false,
		ip_access: null,
	},
};

test('Returns public access rows ordered by sort', () => {
	const output = orderPoliciesByPriority([ar2, ar1], roles);
	expect(output).toEqual([ar1, ar2]);
});

test('Returns role rows sorted by sort', () => {
	const output = orderPoliciesByPriority([ar4, ar3], roles);
	expect(output).toEqual([ar3, ar4]);
});

test('Returns user rows sorted by sort', () => {
	const output = orderPoliciesByPriority([ar8, ar7], roles);
	expect(output).toEqual([ar7, ar8]);
});

test('Orders by public first, passed roles order, user last, sub-sorted by `sort` field', () => {
	const output = orderPoliciesByPriority([ar4, ar8, ar3, ar6, ar5, ar7, ar2, ar1], roles);
	expect(output).toEqual([ar1, ar2, ar3, ar4, ar5, ar6, ar7, ar8]);
});
