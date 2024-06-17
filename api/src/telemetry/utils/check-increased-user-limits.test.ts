import type { Knex } from 'knex';
import { expect, test, vi } from 'vitest';
import { checkIncreasedUserLimits } from './check-increased-user-limits.js';
import { getUserCount } from './get-user-count.js';

vi.mock('./get-user-count.js');

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		USERS_ADMIN_ACCESS_LIMIT: 3,
		USERS_APP_ACCESS_LIMIT: 3,
		USERS_API_ACCESS_LIMIT: 3,
	}),
}));

const mockDb: Knex = {} as unknown as Knex;

test('Errors if limits are exceeded with an increase', () => {
	vi.mocked(getUserCount).mockResolvedValue({ admin: 1, app: 1, api: 1 });

	expect(checkIncreasedUserLimits(mockDb, { admin: 3, app: 0, api: 0 })).rejects.toThrowError(
		'Active Admin users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 3, app: 2, api: 0 })).rejects.toThrowError(
		'Active Admin users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 0, app: 2, api: 0 })).rejects.toThrowError(
		'Active App users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 2, app: 0, api: 0 })).rejects.toThrowError(
		'Active App users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 1, app: 1, api: 0 })).rejects.toThrowError(
		'Active App users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 2, app: 2, api: 0 })).rejects.toThrowError(
		'Active App users limit exceeded.',
	);

	expect(checkIncreasedUserLimits(mockDb, { admin: 0, app: 0, api: 3 })).rejects.toThrowError(
		'Active API users limit exceeded.',
	);
});

test('Does not error if limits are exceeded without any increase', () => {
	vi.mocked(getUserCount).mockResolvedValue({ admin: 3, app: 3, api: 3 });

	expect(() => checkIncreasedUserLimits(mockDb, { admin: 0, app: 0, api: 0 })).not.toThrowError();
});

test('Does not errors if limits are not exceeded with an increase', () => {
	vi.mocked(getUserCount).mockResolvedValue({ admin: 1, app: 1, api: 1 });

	expect(() => checkIncreasedUserLimits(mockDb, { admin: 1, app: 0, api: 0 })).not.toThrowError();
	expect(() => checkIncreasedUserLimits(mockDb, { admin: 0, app: 1, api: 0 })).not.toThrowError();
	expect(() => checkIncreasedUserLimits(mockDb, { admin: 0, app: 0, api: 1 })).not.toThrowError();
	expect(() => checkIncreasedUserLimits(mockDb, { admin: 0, app: 1, api: 2 })).not.toThrowError();
	expect(() => checkIncreasedUserLimits(mockDb, { admin: 1, app: 0, api: 2 })).not.toThrowError();
});
