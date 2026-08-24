import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mockEnv: Record<string, unknown> = {};

vi.mock('@directus/env', () => ({
	useEnv: () => mockEnv,
}));

vi.mock('./database/index.js', () => ({
	default: vi.fn(() => ({})),
}));

vi.mock('./logger/index.js', () => ({
	useLogger: () => ({
		error: vi.fn(),
		warn: vi.fn(),
	}),
}));

vi.mock('./license/index.js', () => ({
	getEntitlementManager: () => ({
		isEntitled: () => true,
	}),
}));

vi.mock('./utils/get-config-from-env.js', () => ({
	getConfigFromEnv: () => ({ driver: 'ldap' }),
}));

const ldapDriverCtor = vi.fn();

vi.mock('./auth/drivers/local.js', () => ({
	LocalAuthDriver: vi.fn().mockImplementation(() => ({ type: 'local' })),
}));

vi.mock('./auth/drivers/ldap.js', () => ({
	LDAPAuthDriver: ldapDriverCtor.mockImplementation(() => ({ type: 'ldap' })),
}));

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	ldapDriverCtor.mockClear();
});

afterEach(() => {
	vi.resetModules();
});

test('registerAuthProviders only dynamically imports drivers that are configured', async () => {
	mockEnv['AUTH_PROVIDERS'] = 'ldap_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(ldapDriverCtor).toHaveBeenCalledTimes(1);
	expect(getAuthProvider('ldap_provider')).toEqual({ type: 'ldap' });
	expect(getAuthProvider('default')).toEqual({ type: 'local' });
});

test('registerAuthProviders does not import unused drivers', async () => {
	const { registerAuthProviders } = await import('./auth.js');

	await registerAuthProviders();

	expect(ldapDriverCtor).not.toHaveBeenCalled();
});
