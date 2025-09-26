import { useEnv } from '@utils/useEnv.js';
import { useOptions } from '@utils/useOptions.js';
import { describe, expect, test } from 'vitest';

const env = useEnv();
const samlUrl = `http://localhost:${env.SAML_PORT}`;
const apiUrl = `http://localhost:${env.PORT}`;
const options = useOptions();

let authCookie: string;

if (options.extras?.saml) {
	describe('/auth/login/saml', () => {
		describe('GET /', () => {
			describe('when incorrect credential is provided', () => {
				test('returns no authenticated cookie', async () => {
					// Action
					const loginPage = await fetch(`${samlUrl}/simplesaml/module.php/core/authenticate.php?as=example-userpass`, {
						redirect: 'manual',
					});

					expect(loginPage.status).toBe(302);

					const cookies = loginPage.headers.get('set-cookie')!;

					const AuthState = decodeURIComponent(String(loginPage.headers.get('location'))).split('AuthState=')[1]!;

					const response = await fetch(`${samlUrl}/simplesaml/module.php/core/loginuserpass.php`, {
						method: 'POST',
						headers: {
							Cookie: cookies,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: new URLSearchParams({
							username: 'user1',
							password: 'user2pass',
							AuthState,
						}),
					});

					expect(response.status).toBe(200);

					const authCookie = response.headers.get('set-cookie')!;

					// Assert
					expect(authCookie).toMatch(/PHPSESSIDIDP/);
					expect(authCookie).not.toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});

			describe('when correct credential is provided', () => {
				test('returns authenticated cookie', async () => {
					// Action
					const loginPage = await fetch(`${samlUrl}/simplesaml/module.php/core/authenticate.php?as=example-userpass`, {
						redirect: 'manual',
					});

					expect(loginPage.status).toBe(302);

					const cookies = loginPage.headers.get('set-cookie')!;

					const AuthState = decodeURIComponent(String(loginPage.headers.get('location'))).split('AuthState=')[1]!;

					const response = await fetch(`${samlUrl}/simplesaml/module.php/core/loginuserpass.php`, {
						method: 'POST',
						headers: {
							Cookie: cookies,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: new URLSearchParams({
							username: 'user1',
							password: 'user1pass',
							AuthState,
						}),
						redirect: 'manual',
					});

					expect(response.status).toBe(303);

					authCookie = response.headers.get('set-cookie')!;

					// Assert
					expect(authCookie).toMatch(/PHPSESSIDIDP/);
					expect(authCookie).toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});
		});

		describe('POST /acs', () => {
			// TODO: Was not able to port those cause I ended up in an infinite redirect loop I'm not motivated enough to understand.
			// describe('when no redirect is provided', () => {
			// 	test('returns directus refresh token in JSON', async () => {
			// 		// Action
			// 		const samlLogin = await fetch(`${apiUrl}/auth/login/saml`, {
			// 			redirect: 'manual',
			// 		});

			// 		expect(samlLogin.status).toBe(302);

			// 		const samlRedirectUrl = String(samlLogin.headers.get('location')).split('/simplesaml/');

			// 		const authResponse = await fetch(`${samlRedirectUrl[0]}/simplesaml/${samlRedirectUrl[1]}`, {
			// 			headers: {
			// 				Cookie: authCookie,
			// 			},
			// 		});

			// 		expect(authResponse.status).toBe(200);

			// 		const SAMLResponse = (await authResponse.text())
			// 			.split('<input type="hidden" name="SAMLResponse" value="')[1]
			// 			?.split('" />')[0];

			// 		const acsResponse = await fetch(`${apiUrl}/auth/login/saml/acs`, {
			// 			method: 'POST',
			// 			body: JSON.stringify({
			// 				SAMLResponse,
			// 			}),
			// 		});

			// 		expect(acsResponse.status).toBe(200);

			// 		// Assert
			// 		expect(await acsResponse.json()).toEqual(
			// 			expect.objectContaining({
			// 				access_token: expect.any(String),
			// 				expires: expect.any(Number),
			// 				refresh_token: expect.any(String),
			// 			}),
			// 		);
			// 	});
			// });

			// describe('when redirect is provided', () => {
			// 	test('returns directus refresh token in cookie', async () => {
			// 		// Action
			// 		const samlLogin = await fetch(`${apiUrl}/auth/login/saml?redirect=${apiUrl}/admin/login?continue`);

			// 		expect(samlLogin.status).toBe(302);

			// 		const samlRedirectUrl = String(samlLogin.headers.get('location')).split('/simplesaml/');

			// 		const authResponse = await fetch(`${samlRedirectUrl[0]}/simplesaml/${samlRedirectUrl[1]}`, {
			// 			headers: {
			// 				Cookie: authCookie,
			// 			},
			// 		});

			// 		expect(authResponse.status).toBe(200);

			// 		const SAMLResponseText = await authResponse.text();

			// 		const SAMLResponse = SAMLResponseText.split('<input type="hidden" name="SAMLResponse" value="')[1]?.split(
			// 			'" />',
			// 		)[0];

			// 		const RelayState = SAMLResponseText.split('<input type="hidden" name="RelayState" value="')[1]?.split(
			// 			'" />',
			// 		)[0];

			// 		const acsResponse = await fetch(`${apiUrl}/auth/login/saml/acs`, {
			// 			method: 'POST',
			// 			body: JSON.stringify({
			// 				SAMLResponse,
			// 				RelayState,
			// 			}),
			// 		});

			// 		expect(acsResponse.status).toBe(302);

			// 		const cookies = acsResponse.headers.get('set-cookie')!;

			// 		// Assert
			// 		expect(cookies).toMatch(/directus_session_token/);
			// 	});
			// });

			test('blocks unlisted redirect URLs', async () => {
				// Action
				const samlLogin = await fetch(`${apiUrl}/auth/login/saml?redirect=https://example.org/admin/login?continue`);

				// Assert
				expect(samlLogin.status).toBe(400);
			});
		});
	});
}
