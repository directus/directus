import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createAdmin } from './create-admin.js';

const { roleCreateOne, policyCreateOne, accessCreateOne, userCreateOne } = vi.hoisted(() => ({
	roleCreateOne: vi.fn().mockResolvedValue('role-id'),
	policyCreateOne: vi.fn().mockResolvedValue('policy-id'),
	accessCreateOne: vi.fn().mockResolvedValue('access-id'),
	userCreateOne: vi.fn().mockResolvedValue('user-id'),
}));

vi.mock('../services/roles.js', () => ({
	RolesService: vi.fn().mockImplementation(() => ({ createOne: roleCreateOne })),
}));

vi.mock('../services/policies.js', () => ({
	PoliciesService: vi.fn().mockImplementation(() => ({ createOne: policyCreateOne })),
}));

vi.mock('../services/access.js', () => ({
	AccessService: vi.fn().mockImplementation(() => ({ createOne: accessCreateOne })),
}));

vi.mock('../services/index.js', () => ({
	UsersService: vi.fn().mockImplementation(() => ({ createOne: userCreateOne })),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({ info: vi.fn() }),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

const schema = {} as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('createAdmin', () => {
	test('does not create role or user when no credentials are provided', async () => {
		await createAdmin(schema);

		expect(roleCreateOne).not.toHaveBeenCalled();
		expect(policyCreateOne).not.toHaveBeenCalled();
		expect(accessCreateOne).not.toHaveBeenCalled();
		expect(userCreateOne).not.toHaveBeenCalled();
	});

	test('creates role, policy, access, and user when credentials are provided', async () => {
		await createAdmin(schema, { email: 'admin@example.com', password: 'password123' });

		expect(roleCreateOne).toHaveBeenCalledOnce();
		expect(policyCreateOne).toHaveBeenCalledOnce();
		expect(accessCreateOne).toHaveBeenCalledOnce();
		expect(userCreateOne).toHaveBeenCalledOnce();
	});

	test('does not create a duplicate Administrator role when bootstrap (no credentials) is followed by onboarding (with credentials)', async () => {
		// Simulate bootstrap with no ADMIN_EMAIL/ADMIN_PASSWORD env vars set
		await createAdmin(schema);

		// Simulate onboarding form submission via POST /server/setup
		await createAdmin(schema, { email: 'admin@example.com', password: 'password123' });

		// The Administrator role should only be created once (during onboarding), not twice
		expect(roleCreateOne).toHaveBeenCalledTimes(1);
	});
});
