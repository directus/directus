import { getUrl } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('/auth/login/saml', () => {
	const authCookies = {} as Record<Vendor, string>;

	describe('GET /', () => {
		describe('when incorrect credential is provided', () => {
			describe('returns no authenticated cookie', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const loginPage = await request('http://127.0.0.1:8880')
						.get(`/simplesaml/module.php/core/authenticate.php?as=example-userpass`)
						.expect(302);

					const cookies = loginPage.headers['set-cookie'].map((cookie: string) => cookie.split(';')[0]).join(';');

					const AuthState = decodeURIComponent(String(loginPage.headers.location)).split('AuthState=')[1];

					const response = await request('http://127.0.0.1:8880')
						.post(`/simplesaml/module.php/core/loginuserpass.php?`)
						.set('Cookie', cookies)
						.set('Content-Type', 'application/x-www-form-urlencoded')
						.send({
							username: 'user1',
							password: 'user2pass',
							AuthState,
						})
						.expect(200);

					authCookies[vendor] = response.headers['set-cookie'].map((cookie: string) => cookie.split(';')[0]).join(';');

					// Assert
					expect(authCookies[vendor]).toMatch(/PHPSESSIDIDP/);
					expect(authCookies[vendor]).not.toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});
		});

		describe('when correct credential is provided', () => {
			describe('returns authenticated cookie', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const loginPage = await request('http://127.0.0.1:8880')
						.get(`/simplesaml/module.php/core/authenticate.php?as=example-userpass`)
						.expect(302);

					const cookies = loginPage.headers['set-cookie'].map((cookie: string) => cookie.split(';')[0]).join(';');

					const AuthState = decodeURIComponent(String(loginPage.headers.location)).split('AuthState=')[1];

					const response = await request('http://127.0.0.1:8880')
						.post(`/simplesaml/module.php/core/loginuserpass.php?`)
						.set('Cookie', cookies)
						.set('Content-Type', 'application/x-www-form-urlencoded')
						.send({
							username: 'user1',
							password: 'user1pass',
							AuthState,
						})
						.expect(303);

					authCookies[vendor] = response.headers['set-cookie'].map((cookie: string) => cookie.split(';')[0]).join(';');

					// Assert
					expect(authCookies[vendor]).toMatch(/PHPSESSIDIDP/);
					expect(authCookies[vendor]).toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});
		});
	});

	describe('POST /acs', () => {
		describe('when no redirect is provided', () => {
			describe('returns directus refresh token in JSON', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const samlLogin = await request(getUrl(vendor)).get('/auth/login/saml').expect(302);
					const samlRedirectUrl = String(samlLogin.headers.location).split('/simplesaml/');

					const authResponse = await request(samlRedirectUrl[0])
						.get(`/simplesaml/${samlRedirectUrl[1]}`)
						.set('Cookie', authCookies[vendor]);

					expect(authResponse.statusCode).toBe(200);

					const SAMLResponse = authResponse.text
						.split('<input type="hidden" name="SAMLResponse" value="')[1]
						?.split('" />')[0];

					const acsResponse = await request(getUrl(vendor))
						.post('/auth/login/saml/acs')
						.send({
							SAMLResponse,
						})
						.expect(200);

					// Assert
					expect(acsResponse.body.data).toEqual(
						expect.objectContaining({
							access_token: expect.any(String),
							expires: expect.any(Number),
							refresh_token: expect.any(String),
						}),
					);
				});
			});
		});

		describe('when redirect is provided', () => {
			describe('returns directus refresh token in cookie', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Action
					const samlLogin = await request(getUrl(vendor))
						.get(`/auth/login/saml?redirect=${getUrl(vendor)}/admin/login?continue`)
						.expect(302);

					const samlRedirectUrl = String(samlLogin.headers.location).split('/simplesaml/');

					const authResponse = await request(samlRedirectUrl[0])
						.get(`/simplesaml/${samlRedirectUrl[1]}`)
						.set('Cookie', authCookies[vendor]);

					expect(authResponse.statusCode).toBe(200);

					const SAMLResponse = authResponse.text
						.split('<input type="hidden" name="SAMLResponse" value="')[1]
						?.split('" />')[0];

					const RelayState = authResponse.text
						.split('<input type="hidden" name="RelayState" value="')[1]
						?.split('" />')[0];

					const acsResponse = await request(getUrl(vendor))
						.post('/auth/login/saml/acs')
						.send({
							SAMLResponse,
							RelayState,
						})
						.expect(302);

					const cookies = acsResponse.headers['set-cookie'].map((cookie: string) => cookie.split(';')[0]).join(';');

					// Assert
					expect(cookies).toMatch(/directus_refresh_token/);
				});
			});
		});
	});
});
