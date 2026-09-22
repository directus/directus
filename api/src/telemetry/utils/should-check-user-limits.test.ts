import { useEnv } from '@directus/env';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { asEnv } from '../../__utils__/as-env.js';
import { shouldCheckUserLimits } from './should-check-user-limits.js';

vi.mock('@directus/env');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue(asEnv({ abcd: 12345 }));
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

test.each([
	{
		env: {
			USERS_ADMIN_ACCESS_LIMIT: Infinity,
			USERS_APP_ACCESS_LIMIT: Infinity,
			USERS_API_ACCESS_LIMIT: Infinity,
		},
		result: false,
	},
	{
		env: {
			USERS_ADMIN_ACCESS_LIMIT: 5,
			USERS_APP_ACCESS_LIMIT: Infinity,
			USERS_API_ACCESS_LIMIT: Infinity,
		},
		result: true,
	},
	{
		env: {
			USERS_ADMIN_ACCESS_LIMIT: Infinity,
			USERS_APP_ACCESS_LIMIT: 5,
			USERS_API_ACCESS_LIMIT: Infinity,
		},
		result: true,
	},
	{
		env: {
			USERS_ADMIN_ACCESS_LIMIT: Infinity,
			USERS_APP_ACCESS_LIMIT: Infinity,
			USERS_API_ACCESS_LIMIT: 5,
		},
		result: true,
	},
])('Confirms if user limits needs to be checked', ({ env, result }) => {
	vi.mocked(useEnv).mockReturnValue(asEnv(env));

	expect(shouldCheckUserLimits()).toBe(result);
});
