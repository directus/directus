import { describe, expect, test, vi } from 'vitest';
import { collectAuthProviders } from './auth.js';

vi.mock('../../../utils/get-auth-providers.js', () => ({
	getAuthProviders: vi.fn().mockReturnValue([]),
}));

import { getAuthProviders } from '../../../utils/get-auth-providers.js';

describe('collectAuthProviders', () => {
	test('returns local driver when default auth is not disabled', () => {
		const result = collectAuthProviders({ AUTH_PROVIDERS: '' });
		expect(result.providers).toContain('local');
	});

	test('does not include local when AUTH_DISABLE_DEFAULT is set', () => {
		const result = collectAuthProviders({ AUTH_PROVIDERS: '', AUTH_DISABLE_DEFAULT: true });
		expect(result.providers).not.toContain('local');
	});

	test('includes configured provider drivers', () => {
		vi.mocked(getAuthProviders).mockReturnValue([
			{ name: 'google', driver: 'openid', icon: 'google' },
		] as any);

		const result = collectAuthProviders({ AUTH_PROVIDERS: 'google' });
		expect(result.providers).toContain('openid');
	});

	test('detects issuers from provider URLs', () => {
		vi.mocked(getAuthProviders).mockReturnValue([
			{ name: 'myoidc', driver: 'openid', icon: 'key' },
		] as any);

		const result = collectAuthProviders({
			AUTH_PROVIDERS: 'myoidc',
			AUTH_MYOIDC_ISSUER_URL: 'https://login.microsoftonline.com/tenant/v2.0',
		});

		expect(result.issuers).toContain('azuread');
	});

	test('returns empty arrays when no providers configured and default disabled', () => {
		const result = collectAuthProviders({ AUTH_PROVIDERS: '', AUTH_DISABLE_DEFAULT: true });
		expect(result).toEqual({ providers: [], issuers: [] });
	});
});
