import { expect, test, vi } from 'vitest';
import { checkUserLimits } from './check-user-limits.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		USERS_ADMIN_ACCESS_LIMIT: 3,
		USERS_APP_ACCESS_LIMIT: 3,
		USERS_API_ACCESS_LIMIT: 3,
	}),
}));

test('Errors if limits are exceeded', async () => {
	await expect(checkUserLimits({ admin: 4, app: 0, api: 0 })).rejects.toThrowError(
		'Active Admin users limit exceeded.',
	);

	await expect(checkUserLimits({ admin: 2, app: 2, api: 0 })).rejects.toThrowError('Active App users limit exceeded.');

	await expect(checkUserLimits({ admin: 0, app: 4, api: 0 })).rejects.toThrowError('Active App users limit exceeded.');

	await expect(checkUserLimits({ admin: 0, app: 0, api: 4 })).rejects.toThrowError('Active API users limit exceeded.');
});

test('Does not errors if limits are not exceeded', () => {
	expect(() => checkUserLimits({ admin: 1, app: 0, api: 0 })).not.toThrowError();
	expect(() => checkUserLimits({ admin: 0, app: 1, api: 0 })).not.toThrowError();
	expect(() => checkUserLimits({ admin: 0, app: 0, api: 1 })).not.toThrowError();
	expect(() => checkUserLimits({ admin: 1, app: 1, api: 1 })).not.toThrowError();
	expect(() => checkUserLimits({ admin: 2, app: 1, api: 2 })).not.toThrowError();
});
