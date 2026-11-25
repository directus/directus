import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import type { Accountability } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_AUTH_PROVIDER } from '../../../constants.js';
import { UsersService } from '../../../services/index.js';
import { checkUsersSSO, resolveSSOUsers, splitSsoUsers } from './sso-enabled.js';

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../services/index.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	return { UsersService: mockItemsService().ItemsService };
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
		await expect(resolveSSOUsers(true, {})).resolves.toEqual([]);

		expect(UsersService.prototype.updateMany).not.toHaveBeenCalled();
		expect(UsersService.prototype.updateOne).not.toHaveBeenCalled();
	});

	test('deactivates and returns only active non-admin SSO users', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([{ id: 's1' }, { id: 's2' }]);

		await expect(resolveSSOUsers(true, ctx)).resolves.toEqual(['s1', 's2']);

		expect(UsersService.prototype.readByQuery).toHaveBeenCalledWith({
			fields: ['id'],
			filter: {
				_and: [
					{ provider: { _neq: DEFAULT_AUTH_PROVIDER, _nnull: true } },
					{ id: { _neq: 'admin' } },
					{ status: { _eq: 'active' } },
				],
			},
			limit: -1,
		});

		expect(UsersService.prototype.updateMany).toHaveBeenCalledWith(['s1', 's2'], {
			status: USER_INACTIVE_LICENSE_STATUS,
		});
	});

	test('returns [] and changes nothing when no SSO user matches', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([]);

		await expect(resolveSSOUsers(true, ctx)).resolves.toEqual([]);
		expect(UsersService.prototype.updateMany).not.toHaveBeenCalled();
	});

	test('updates the admin credentials before deactivating SSO users', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([{ id: 's1' }]);
		vi.mocked(UsersService.prototype.updateOne).mockRejectedValueOnce(new Error('password policy'));

		await expect(resolveSSOUsers({ admin: { password: 'weak' } }, ctx)).rejects.toThrow('password policy');
		expect(UsersService.prototype.updateMany).not.toHaveBeenCalled();
	});

	test('the admin credential change is not in the returned ids', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([{ id: 's1' }]);

		await expect(resolveSSOUsers({ admin: { email: 'a@b.com' } }, ctx)).resolves.toEqual(['s1']);
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

describe('splitSsoUsers', () => {
	test('separates users with a non-default provider', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([
			{ id: 'u1', provider: 'default' },
			{ id: 's1', provider: 'github' },
		]);

		await expect(splitSsoUsers(['u1', 's1'])).resolves.toEqual({ seats: ['u1'], sso_users: ['s1'] });
	});

	test('skips the query for an empty list', async () => {
		await expect(splitSsoUsers([])).resolves.toEqual({ seats: [], sso_users: [] });
		expect(UsersService.prototype.readByQuery).not.toHaveBeenCalled();
	});
});
