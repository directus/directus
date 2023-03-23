import { describe, expect, test } from 'vitest';
import env from '../env';
import { redactHeaderCookie } from './redact-header-cookies';

describe('redactHeaderCookie', () => {
	describe('Given auth cookies', () => {
		test('When it finds a refresh_token, it should redact the value', () => {
			const tokenKey = env.REFRESH_TOKEN_COOKIE_NAME;
			const cookieHeader = `${tokenKey}=shh;`;
			const cookieNames = [`${tokenKey}`];

			const redactedCookie = redactHeaderCookie(cookieHeader, cookieNames);
			expect(redactedCookie).toBe(`${tokenKey}=--redacted--;`);
		});
		test('When it finds an access_token, it should redact the value', () => {
			const tokenKey = 'access_token';
			const cookieHeader = `${tokenKey}=secret;`;
			const cookieNames = [`${tokenKey}`];

			const redactedCookie = redactHeaderCookie(cookieHeader, cookieNames);
			expect(redactedCookie).toBe(`${tokenKey}=--redacted--;`);
		});
		test('When it finds both an access_token and refresh_token, it should redact both values', () => {
			const cookieHeader = `access_token=secret; ${env.REFRESH_TOKEN_COOKIE_NAME}=shhhhhhh; randomCookie=Erdtree;`;
			const cookieNames = ['access_token', `${env.REFRESH_TOKEN_COOKIE_NAME}`];

			const redactedCookie = redactHeaderCookie(cookieHeader, cookieNames);
			expect(redactedCookie).toBe(
				`access_token=--redacted--; ${env.REFRESH_TOKEN_COOKIE_NAME}=--redacted--; randomCookie=Erdtree;`
			);
		});
	});
	describe('Given negligible cookies', () => {
		test('It should return the orignal value', () => {
			const originalCookie = `Crown=Swords; Hail=Sithis;`;
			const cookieNames = [env.REFRESH_TOKEN_COOKIE_NAME, 'access_token'];

			const redactedCookie = redactHeaderCookie(originalCookie, cookieNames);
			expect(redactedCookie).toBe(originalCookie);
		});
	});
});
