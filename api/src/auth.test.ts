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

let configuredDriver: string | undefined = 'ldap';

vi.mock('./utils/get-config-from-env.js', () => ({
	getConfigFromEnv: () => ({ driver: configuredDriver }),
}));

const ldapDriverCtor = vi.fn();
const oauth2DriverCtor = vi.fn();
const openidDriverCtor = vi.fn();
const samlDriverCtor = vi.fn();

vi.mock('./auth/drivers/local.js', () => ({
	LocalAuthDriver: vi.fn().mockImplementation(() => ({ type: 'local' })),
}));

vi.mock('./auth/drivers/ldap.js', () => ({
	LDAPAuthDriver: ldapDriverCtor.mockImplementation(() => ({ type: 'ldap' })),
}));

vi.mock('./auth/drivers/oauth2.js', () => ({
	OAuth2AuthDriver: oauth2DriverCtor.mockImplementation(() => ({ type: 'oauth2' })),
}));

vi.mock('./auth/drivers/openid.js', () => ({
	OpenIDAuthDriver: openidDriverCtor.mockImplementation(() => ({ type: 'openid' })),
}));

vi.mock('./auth/drivers/saml.js', () => ({
	SAMLAuthDriver: samlDriverCtor.mockImplementation(() => ({ type: 'saml' })),
}));

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	configuredDriver = 'ldap';
	ldapDriverCtor.mockClear();
	oauth2DriverCtor.mockClear();
	openidDriverCtor.mockClear();
	samlDriverCtor.mockClear();
});

afterEach(() => {
	vi.resetModules();
});

test('registerAuthProviders only dynamically imports drivers that are configured', async () => {
	mockEnv['AUTH_PROVIDERS'] = 'ldap_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(ldapDriverCtor).toHaveBeenCalledTimes(1);
	expect(oauth2DriverCtor).not.toHaveBeenCalled();
	expect(openidDriverCtor).not.toHaveBeenCalled();
	expect(samlDriverCtor).not.toHaveBeenCalled();
	expect(getAuthProvider('ldap_provider')).toEqual({ type: 'ldap' });
	expect(getAuthProvider('default')).toEqual({ type: 'local' });
});

test('registerAuthProviders does not import unused drivers when AUTH_PROVIDERS is unset', async () => {
	const { registerAuthProviders } = await import('./auth.js');

	await registerAuthProviders();

	expect(ldapDriverCtor).not.toHaveBeenCalled();
	expect(oauth2DriverCtor).not.toHaveBeenCalled();
	expect(openidDriverCtor).not.toHaveBeenCalled();
	expect(samlDriverCtor).not.toHaveBeenCalled();
});

test('registerAuthProviders dynamically imports the oauth2 driver when configured', async () => {
	configuredDriver = 'oauth2';
	mockEnv['AUTH_PROVIDERS'] = 'oauth2_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(oauth2DriverCtor).toHaveBeenCalledTimes(1);
	expect(getAuthProvider('oauth2_provider')).toEqual({ type: 'oauth2' });
});

test('registerAuthProviders dynamically imports the openid driver when configured', async () => {
	configuredDriver = 'openid';
	mockEnv['AUTH_PROVIDERS'] = 'openid_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(openidDriverCtor).toHaveBeenCalledTimes(1);
	expect(getAuthProvider('openid_provider')).toEqual({ type: 'openid' });
});

test('registerAuthProviders dynamically imports the saml driver when configured', async () => {
	configuredDriver = 'saml';
	mockEnv['AUTH_PROVIDERS'] = 'saml_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(samlDriverCtor).toHaveBeenCalledTimes(1);
	expect(getAuthProvider('saml_provider')).toEqual({ type: 'saml' });
});

test('registerAuthProviders skips providers with no driver defined', async () => {
	configuredDriver = undefined;
	mockEnv['AUTH_PROVIDERS'] = 'missing_driver_provider';

	const { registerAuthProviders, getAuthProvider } = await import('./auth.js');

	await registerAuthProviders();

	expect(() => getAuthProvider('missing_driver_provider')).toThrow();
});

test('getAuthProvider throws for an unconfigured provider', async () => {
	const { getAuthProvider } = await import('./auth.js');

	expect(() => getAuthProvider('does_not_exist')).toThrow();
});
