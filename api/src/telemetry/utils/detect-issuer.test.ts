import { describe, expect, test } from 'vitest';
import { detectIssuer } from './detect-issuer.js';

describe('detectIssuer', () => {
	test('detects issuer from oauth2 authorize URL', () => {
		const env = { AUTH_MYOAUTH_AUTHORIZE_URL: 'https://accounts.google.com/o/oauth2/auth' };
		expect(detectIssuer(env, 'myoauth', 'oauth2')).toBe('google');
	});

	test('detects issuer from openid issuer URL', () => {
		const env = { AUTH_MYOIDC_ISSUER_URL: 'https://login.microsoftonline.com/tenant/v2.0' };
		expect(detectIssuer(env, 'myoidc', 'openid')).toBe('azuread');
	});

	test('detects issuer from ldap client URL', () => {
		const env = { AUTH_MYLDAP_CLIENT_URL: 'https://ldap.jumpcloud.com' };
		expect(detectIssuer(env, 'myldap', 'ldap')).toBe('jumpcloud');
	});

	test('returns null for unknown driver', () => {
		const env = { AUTH_MYPROVIDER_URL: 'https://auth0.com' };
		expect(detectIssuer(env, 'myprovider', 'custom')).toBe(null);
	});

	test('returns null when no URL is configured', () => {
		expect(detectIssuer({}, 'myoidc', 'openid')).toBe(null);
	});

	test('handles case-insensitive provider names', () => {
		const env = { AUTH_MYPROVIDER_ISSUER_URL: 'https://my-tenant.auth0.com' };
		expect(detectIssuer(env, 'myprovider', 'openid')).toBe('auth0');
	});
});
