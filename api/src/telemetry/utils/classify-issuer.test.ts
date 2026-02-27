import { describe, expect, test } from 'vitest';
import { classifyIssuer } from './classify-issuer.js';

describe('classifyIssuer', () => {
	test('returns null for undefined input', () => {
		expect(classifyIssuer(undefined)).toBe(null);
	});

	test('returns null for empty string', () => {
		expect(classifyIssuer('')).toBe(null);
	});

	test('classifies Auth0 URLs', () => {
		expect(classifyIssuer('https://my-tenant.auth0.com')).toBe('auth0');
	});

	test('classifies Okta URLs', () => {
		expect(classifyIssuer('https://dev-12345.okta.com')).toBe('okta');
	});

	test('classifies Cognito URLs', () => {
		expect(classifyIssuer('https://cognito-idp.us-east-1.amazonaws.com/pool')).toBe('cognito');
	});

	test('classifies Azure AD URLs via microsoftonline', () => {
		expect(classifyIssuer('https://login.microsoftonline.com/tenant/v2.0')).toBe('azuread');
	});

	test('classifies Azure AD URLs via azure', () => {
		expect(classifyIssuer('https://my-app.azure.com/auth')).toBe('azuread');
	});

	test('classifies Google URLs', () => {
		expect(classifyIssuer('https://accounts.google.com')).toBe('google');
	});

	test('classifies GitHub URLs', () => {
		expect(classifyIssuer('https://github.com/login/oauth')).toBe('github');
	});

	test('classifies GitLab URLs', () => {
		expect(classifyIssuer('https://gitlab.com/oauth')).toBe('gitlab');
	});

	test('classifies OneLogin URLs', () => {
		expect(classifyIssuer('https://my-org.onelogin.com')).toBe('onelogin');
	});

	test('classifies JumpCloud URLs', () => {
		expect(classifyIssuer('https://sso.jumpcloud.com')).toBe('jumpcloud');
	});

	test('classifies Ping Identity URLs via pingidentity', () => {
		expect(classifyIssuer('https://auth.pingidentity.com')).toBe('ping');
	});

	test('classifies Ping Identity URLs via pingfed', () => {
		expect(classifyIssuer('https://sso.pingfed.example.com')).toBe('ping');
	});

	test('classifies Salesforce URLs', () => {
		expect(classifyIssuer('https://login.salesforce.com')).toBe('salesforce');
	});

	test('classifies Apple URLs', () => {
		expect(classifyIssuer('https://appleid.apple.com')).toBe('apple');
	});

	test('classifies Facebook URLs', () => {
		expect(classifyIssuer('https://www.facebook.com/dialog/oauth')).toBe('facebook');
	});

	test('classifies Keycloak URLs', () => {
		expect(classifyIssuer('https://keycloak.example.com/realms/myrealm')).toBe('keycloak');
	});

	test('returns other for unknown issuers', () => {
		expect(classifyIssuer('https://custom-idp.example.com')).toBe('other');
	});

	test('is case-insensitive', () => {
		expect(classifyIssuer('https://LOGIN.MICROSOFTONLINE.COM/tenant')).toBe('azuread');
	});
});
