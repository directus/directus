import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import type { Accountability } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_AUTH_PROVIDER } from '../../../constants.js';
import { UsersService } from '../../../services/index.js';
import { checkUsersSSO, resolveSSOUsers } from './sso-enabled.js';

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../services/index.js', async () => {
	const { mockUsersService } = await import('../../../test-utils/services/users-service.js');
	return mockUsersService();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('checkUsersSSO', () => {
	test('returns true when no active SSO users exist', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([]);

		await expect(checkUsersSSO()).resolves.toBe(true);
	});

	test('returns false when active SSO users exist', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([{ id: '1' }]);

		await expect(checkUsersSSO()).resolves.toBe(false);
	});
});

describe('resolveSSOUsers', () => {
	const ctx = { accountability: { user: 'admin' } as Accountability };

	test('no-op when no acting user', async () => {
		await resolveSSOUsers(true, {});

		expect(UsersService.prototype.updateByQuery).not.toHaveBeenCalled();
		expect(UsersService.prototype.updateOne).not.toHaveBeenCalled();
	});

	test('deactivates non-default-provider users while excluding the acting admin', async () => {
		await resolveSSOUsers(true, ctx);

		expect(UsersService.prototype.updateByQuery).toHaveBeenCalledWith(
			{
				filter: {
					_and: [{ provider: { _neq: DEFAULT_AUTH_PROVIDER, _nnull: true } }, { id: { _neq: 'admin' } }],
				},
			},
			{ status: USER_INACTIVE_LICENSE_STATUS },
		);
	});

	test.each([
		['resolution is a boolean', true],
		['admin is empty', {}],
	])('does not reset admin credentials when %s', async (_label, resolution) => {
		await resolveSSOUsers(resolution as any, ctx);

		expect(UsersService.prototype.updateOne).not.toHaveBeenCalled();
	});

	test.each([
		['email and password', { email: 'a@b.com', password: 'pw' }, { email: 'a@b.com', password: 'pw' }],
		['only the email', { email: 'a@b.com' }, { email: 'a@b.com' }],
		['only the password', { password: 'pw' }, { password: 'pw' }],
	])('resets the admin with %s', async (_label, admin, expected) => {
		await resolveSSOUsers({ admin } as any, ctx);

		expect(UsersService.prototype.updateOne).toHaveBeenCalledWith('admin', {
			provider: DEFAULT_AUTH_PROVIDER,
			...expected,
		});
	});
});
