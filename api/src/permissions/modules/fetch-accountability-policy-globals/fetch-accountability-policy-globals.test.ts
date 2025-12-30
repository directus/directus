import { fetchAccountabilityPolicyGlobals } from './fetch-accountability-policy-globals.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../lib/fetch-policies.js');

let knex: Knex;

beforeEach(() => {
	vi.clearAllMocks();

	knex = {
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		whereIn: vi.fn().mockReturnThis(),
		first: vi.fn(),
	} as unknown as Knex;
});

test('Return enforce_tfa true if a policy with enforce_tfa is found', async () => {
	vi.mocked(knex.first).mockResolvedValue({});
	vi.mocked(fetchPolicies).mockResolvedValue(['policy-a']);

	const result = await fetchAccountabilityPolicyGlobals(
		{ app: true, admin: false, roles: [], user: '' } as unknown as Accountability,
		{ knex } as any,
	);

	expect(result).toEqual({ app_access: true, admin_access: false, enforce_tfa: true });
	expect(knex.whereIn).toHaveBeenCalledWith('id', ['policy-a']);
});

test('Return enforce_tfa false if no policy with enforce_tfa is found', async () => {
	vi.mocked(knex.first).mockResolvedValue(undefined);
	vi.mocked(fetchPolicies).mockResolvedValue(['policy-a']);

	const result = await fetchAccountabilityPolicyGlobals(
		{ app: true, admin: false, roles: [], user: '' } as unknown as Accountability,
		{ knex } as any,
	);

	expect(result).toEqual({ app_access: true, admin_access: false, enforce_tfa: false });
	expect(knex.whereIn).toHaveBeenCalledWith('id', ['policy-a']);
});
