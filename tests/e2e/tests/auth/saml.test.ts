import { createDirectus, createRole, readRole, rest, staticToken } from '@directus/sdk';
import { env, options, port } from '@utils/constants.js';
import { beforeAll, describe, expect, test } from 'vitest';

const samlUrl = `http://localhost:${env.SAML_PORT}`;
const apiUrl = `http://localhost:${port}`;

/** Only the name=value pairs of a Set-Cookie list, so they can be sent back as a Cookie header. */
function cookieHeader(headers: Headers) {
	return headers
		.getSetCookie()
		.map((entry) => entry.split(';')[0])
		.join('; ');
}

/**
 * Signs in at the identity provider and returns its session cookie. Each ACS test needs a live IdP
 * session, so this is shared rather than leaning on whichever test ran first.
 */
async function idpLogin(password: string) {
	const loginPage = await fetch(`${samlUrl}/simplesaml/module.php/core/authenticate.php?as=example-userpass`, {
		redirect: 'manual',
	});

	expect(loginPage.status).toBe(302);

	const AuthState = decodeURIComponent(String(loginPage.headers.get('location'))).split('AuthState=')[1]!;

	const response = await fetch(`${samlUrl}/simplesaml/module.php/core/loginuserpass.php`, {
		method: 'POST',
		headers: {
			Cookie: cookieHeader(loginPage.headers),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({ username: 'user1', password, AuthState }),
		redirect: 'manual',
	});

	return { status: response.status, cookie: cookieHeader(response.headers) };
}

if (options.extras?.saml) {
	describe('/auth/login/saml', () => {
		describe('GET /', () => {
			describe('when incorrect credential is provided', () => {
				test('returns no authenticated cookie', async () => {
					const { status, cookie } = await idpLogin('user2pass');

					expect(status).toBe(200);
					expect(cookie).toMatch(/PHPSESSIDIDP/);
					expect(cookie).not.toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});

			describe('when correct credential is provided', () => {
				test('returns authenticated cookie', async () => {
					const { status, cookie } = await idpLogin('user1pass');

					expect(status).toBe(303);
					expect(cookie).toMatch(/PHPSESSIDIDP/);
					expect(cookie).toMatch(/SimpleSAMLAuthTokenIdp/);
				});
			});
		});

		describe('POST /acs', () => {
			/**
			 * Walks the SAML redirect dance by hand: ask Directus to start a login, follow the
			 * redirect to the IdP with the session cookie from the login above, and pull the
			 * auto-submitting form's fields back out of the HTML it answers with.
			 */
			beforeAll(async () => {
				// The provider assigns every user it registers to this role, which has to exist first
				const api = createDirectus<any>(apiUrl).with(rest()).with(staticToken('admin'));
				const role = env.AUTH_SAML_DEFAULT_ROLE_ID!;

				await api.request(readRole(role)).catch(() => api.request(createRole({ id: role, name: 'SAML Users' } as any)));
			});

			async function assertion(redirect?: string) {
				const samlLogin = await fetch(
					`${apiUrl}/auth/login/saml${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
					{ redirect: 'manual' },
				);

				expect(samlLogin.status).toBe(302);

				const { cookie } = await idpLogin('user1pass');

				const idpResponse = await fetch(String(samlLogin.headers.get('location')), {
					headers: { Cookie: cookie },
					redirect: 'manual',
				});

				expect(idpResponse.status).toBe(200);

				const html = await idpResponse.text();

				const field = (name: string) => html.split(`<input type="hidden" name="${name}" value="`)[1]?.split('" />')[0];

				const SAMLResponse = field('SAMLResponse');

				expect(SAMLResponse).toBeDefined();

				return { SAMLResponse: SAMLResponse!, RelayState: field('RelayState') };
			}

			/** The assertion consumer service speaks the SAML HTTP POST binding, not JSON. */
			function postAcs(body: Record<string, string | undefined>) {
				const form = new URLSearchParams();

				for (const [key, value] of Object.entries(body)) {
					if (value !== undefined) form.set(key, value);
				}

				return fetch(`${apiUrl}/auth/login/saml/acs`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: form,
					redirect: 'manual',
				});
			}

			describe('when no redirect is provided', () => {
				test('returns directus refresh token in JSON', async () => {
					const { SAMLResponse } = await assertion();

					const acsResponse = await postAcs({ SAMLResponse });

					expect(acsResponse.status).toBe(200);

					expect(await acsResponse.json()).toEqual(
						expect.objectContaining({
							data: expect.objectContaining({
								access_token: expect.any(String),
								expires: expect.any(Number),
								refresh_token: expect.any(String),
							}),
						}),
					);
				});
			});

			describe('when redirect is provided', () => {
				test('returns directus refresh token in cookie', async () => {
					// The redirect has to sit on the instance's own origin to pass the allow list
					const { SAMLResponse, RelayState } = await assertion(`${env.PUBLIC_URL}/admin/login?continue`);

					const acsResponse = await postAcs({ SAMLResponse, RelayState });

					expect(acsResponse.status).toBe(302);

					expect(acsResponse.headers.getSetCookie().join('; ')).toMatch(/directus_session_token/);
				});
			});

			test('blocks unlisted redirect URLs', async () => {
				// Action
				const samlLogin = await fetch(`${apiUrl}/auth/login/saml?redirect=https://example.org/admin/login?continue`);

				// Assert
				expect(samlLogin.status).toBe(400);
			});
		});
	});
}
