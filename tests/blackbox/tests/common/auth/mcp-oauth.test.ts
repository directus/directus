/**
 * MCP OAuth Integration Tests
 *
 * These tests require the following environment variables to be set on the Directus instance:
 *   MCP_ENABLED=true
 *   MCP_OAUTH_ENABLED=true
 *
 * The blackbox test config (tests/blackbox/common/config.ts) should include these in
 * directusConfig when MCP OAuth tests are enabled.
 *
 * NOTE: These tests cannot be run locally without Docker Compose + database setup.
 */

import crypto from 'node:crypto';
import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import WebSocket from 'ws';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePKCE() {
	const verifier = crypto.randomBytes(32).toString('hex');
	const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
	return { verifier, challenge };
}

/**
 * Extract the authorization code from a redirect Location header.
 * Location looks like: http://localhost/callback?code=abc123&iss=...
 */
function extractCodeFromLocation(location: string): string {
	const url = new URL(location);
	const code = url.searchParams.get('code');
	if (!code) throw new Error(`No code in location: ${location}`);
	return code;
}

/**
 * Log in as admin using session mode and return the Set-Cookie header array.
 */
async function loginAsAdmin(baseUrl: string): Promise<string[]> {
	const res = await request(baseUrl)
		.post('/auth/login')
		.send({ email: USER.ADMIN.EMAIL, password: USER.ADMIN.PASSWORD, mode: 'session' })
		.expect(200);

	const cookies = res.headers['set-cookie'] as string[] | string | undefined;
	if (!cookies) throw new Error('No Set-Cookie header in login response');
	return Array.isArray(cookies) ? cookies : [cookies];
}

/**
 * Register a test OAuth client and return client_id.
 */
async function registerClient(
	baseUrl: string,
	opts: { redirectUri?: string; grantTypes?: string[] } = {},
): Promise<string> {
	const redirectUri = opts.redirectUri ?? `${baseUrl}/mcp-oauth-test-callback`;
	const grantTypes = opts.grantTypes ?? ['authorization_code', 'refresh_token'];

	const res = await request(baseUrl)
		.post('/mcp-oauth/register')
		.send({
			client_name: `test-client-${Date.now()}`,
			redirect_uris: [redirectUri],
			grant_types: grantTypes,
		})
		.expect(201);

	return res.body.client_id as string;
}

/**
 * Run the full authorize flow (validate + decision) and return the raw authorization code.
 * Requires an already-authenticated session (cookies).
 */
/**
 * Extract signed_params from the server-rendered consent page HTML.
 */
function extractSignedParams(html: string): string {
	const match = html.match(/name="signed_params"\s+value="([^"]+)"/);
	if (!match?.[1]) throw new Error('signed_params not found in consent page HTML');
	return match[1];
}

async function authorize(
	baseUrl: string,
	cookies: string[],
	clientId: string,
	redirectUri: string,
	pkce: { verifier: string; challenge: string },
): Promise<string> {
	// 1. GET the consent page (server-rendered HTML with signed_params baked in)
	const consentRes = await request(baseUrl)
		.get('/mcp-oauth/authorize')
		.set('Cookie', cookies)
		.query({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			code_challenge: pkce.challenge,
			code_challenge_method: 'S256',
			scope: 'mcp:access',
			resource: `${baseUrl}/mcp`,
		})
		.expect(200);

	const signed_params = extractSignedParams(consentRes.text);

	// 2. POST the decision (native form submit)
	const decisionRes = await request(baseUrl)
		.post('/mcp-oauth/authorize/decision')
		.set('Cookie', cookies)
		.set('Origin', baseUrl)
		.type('form')
		.send({ signed_params, approved: 'true' })
		.expect(302);

	const location = decisionRes.headers['location'] as string;
	return extractCodeFromLocation(location);
}

/**
 * Exchange an authorization code for tokens.
 */
async function exchangeCode(
	baseUrl: string,
	clientId: string,
	code: string,
	redirectUri: string,
	codeVerifier: string,
): Promise<{ access_token: string; refresh_token: string; token_type: string; expires_in: number; scope: string }> {
	const res = await request(baseUrl)
		.post('/mcp-oauth/token')
		.type('form')
		.send({
			grant_type: 'authorization_code',
			client_id: clientId,
			code,
			redirect_uri: redirectUri,
			code_verifier: codeVerifier,
			resource: `${baseUrl}/mcp`,
		})
		.expect(200);

	return res.body;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('/mcp-oauth', () => {
	// -------------------------------------------------------------------------
	// Discovery endpoints
	// -------------------------------------------------------------------------
	describe('discovery endpoints', () => {
		it.each(vendors)('%s - GET /.well-known/oauth-protected-resource', async (vendor) => {
			const url = getUrl(vendor);
			const res = await request(url).get('/.well-known/oauth-protected-resource').expect(200);

			expect(res.body).toMatchObject({
				resource: `${url}/mcp`,
				authorization_servers: [url],
				scopes_supported: ['mcp:access'],
			});
		});

		// RFC 9728 Section 3: path-based insertion -- MCP clients derive this URL from the resource identifier
		it.each(vendors)('%s - GET /.well-known/oauth-protected-resource/mcp (path insertion)', async (vendor) => {
			const url = getUrl(vendor);
			const res = await request(url).get('/.well-known/oauth-protected-resource/mcp').expect(200);

			expect(res.body).toMatchObject({
				resource: `${url}/mcp`,
				authorization_servers: [url],
				scopes_supported: ['mcp:access'],
			});
		});

		it.each(vendors)('%s - GET /.well-known/oauth-authorization-server', async (vendor) => {
			const url = getUrl(vendor);
			const res = await request(url).get('/.well-known/oauth-authorization-server').expect(200);

			expect(res.body).toMatchObject({
				issuer: url,
				authorization_endpoint: `${url}/mcp-oauth/authorize`,
				token_endpoint: `${url}/mcp-oauth/token`,
				registration_endpoint: `${url}/mcp-oauth/register`,
				revocation_endpoint: `${url}/mcp-oauth/revoke`,
				response_types_supported: ['code'],
				grant_types_supported: ['authorization_code', 'refresh_token'],
				code_challenge_methods_supported: ['S256'],
				token_endpoint_auth_methods_supported: ['none'],
				scopes_supported: ['mcp:access'],
			});
		});

		// RFC 8414 Section 3: path-based insertion for issuer with path component
		it.each(vendors)('%s - GET /.well-known/oauth-authorization-server/mcp (path insertion)', async (vendor) => {
			const url = getUrl(vendor);
			const res = await request(url).get('/.well-known/oauth-authorization-server/mcp').expect(200);

			expect(res.body).toMatchObject({
				issuer: url,
				token_endpoint: `${url}/mcp-oauth/token`,
			});
		});
	});

	// -------------------------------------------------------------------------
	// Dynamic Client Registration
	// -------------------------------------------------------------------------
	describe('POST /mcp-oauth/register', () => {
		it.each(vendors)('%s - registers a new client', async (vendor) => {
			const url = getUrl(vendor);

			const res = await request(url)
				.post('/mcp-oauth/register')
				.send({
					client_name: 'Test MCP Client',
					redirect_uris: [`${url}/callback`],
					grant_types: ['authorization_code', 'refresh_token'],
				})
				.expect(201);

			expect(res.body).toMatchObject({
				client_id: expect.any(String),
				client_name: 'Test MCP Client',
				redirect_uris: [`${url}/callback`],
				grant_types: ['authorization_code', 'refresh_token'],
				response_types: ['code'],
				token_endpoint_auth_method: 'none',
				client_id_issued_at: expect.any(Number),
			});
		});

		it.each(vendors)('%s - rejects missing client_name', async (vendor) => {
			const url = getUrl(vendor);

			const res = await request(url)
				.post('/mcp-oauth/register')
				.send({ redirect_uris: [`${url}/callback`], grant_types: ['authorization_code'] })
				.expect(400);

			expect(res.body.error).toBe('invalid_client_metadata');
		});

		it.each(vendors)('%s - rejects missing redirect_uris', async (vendor) => {
			const url = getUrl(vendor);

			const res = await request(url)
				.post('/mcp-oauth/register')
				.send({ client_name: 'Test', grant_types: ['authorization_code'] })
				.expect(400);

			expect(res.body.error).toBe('invalid_redirect_uri');
		});
	});

	// -------------------------------------------------------------------------
	// Full OAuth flow
	// -------------------------------------------------------------------------
	describe('full OAuth flow', () => {
		it.each(vendors)(
			'%s - register, authorize, consent, exchange, refresh, revoke',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-test-callback`;

				// 1. Register client
				const clientId = await registerClient(url, { redirectUri });

				// 2. Login as admin (session cookie)
				const cookies = await loginAsAdmin(url);

				// 3. PKCE
				const pkce = generatePKCE();

				// 4+5. Validate + Decision (full authorize flow)
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);

				// 6. Exchange code for tokens
				const tokens = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);

				expect(tokens).toMatchObject({
					access_token: expect.any(String),
					token_type: 'Bearer',
					expires_in: expect.any(Number),
					refresh_token: expect.any(String),
					scope: 'mcp:access',
				});

				const { access_token, refresh_token } = tokens;

				// 7. Access /mcp - verify OAuth token is accepted
				const mcpRes = await request(url)
					.post('/mcp')
					.set('Authorization', `Bearer ${access_token}`)
					.set('Accept', 'application/json')
					.send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

				// 200 = auth passed and tools listed. 401/403 = auth rejected.
				expect(mcpRes.status).toBe(200);

				// 8. Refresh token
				const refreshRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'refresh_token',
						client_id: clientId,
						refresh_token,
						resource: `${url}/mcp`,
					})
					.expect(200);

				expect(refreshRes.body).toMatchObject({
					access_token: expect.any(String),
					token_type: 'Bearer',
					expires_in: expect.any(Number),
					refresh_token: expect.any(String),
					scope: 'mcp:access',
				});

				// Tokens must actually rotate
				expect(refreshRes.body.access_token).not.toBe(access_token);
				expect(refreshRes.body.refresh_token).not.toBe(refresh_token);

				const newRefreshToken = refreshRes.body.refresh_token as string;

				// 9. Revoke the new refresh token
				await request(url)
					.post('/mcp-oauth/revoke')
					.type('form')
					.send({ token: newRefreshToken, client_id: clientId })
					.expect(200);

				// After revocation, refresh should fail
				const afterRevokeRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'refresh_token',
						client_id: clientId,
						refresh_token: newRefreshToken,
						resource: `${url}/mcp`,
					});

				expect(afterRevokeRes.status).toBe(400);
				expect(afterRevokeRes.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Token isolation: OAuth tokens must NOT access non-MCP endpoints
	// -------------------------------------------------------------------------
	describe('OAuth token isolation', () => {
		it.each(vendors)(
			'%s - OAuth access_token cannot access /items, /graphql, /auth/refresh',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-isolation-callback`;

				// Full flow to get access_token
				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);
				const tokens = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);
				const { access_token } = tokens;

				// /items should reject the OAuth token
				const itemsRes = await request(url).get('/items/directus_users').set('Authorization', `Bearer ${access_token}`);

				expect(itemsRes.status).toBe(403);

				// /graphql should reject the OAuth token
				const graphqlRes = await request(url)
					.post('/graphql')
					.set('Authorization', `Bearer ${access_token}`)
					.send({ query: '{ __typename }' });

				expect(graphqlRes.status).toBe(403);

				// /auth/refresh should reject the OAuth token
				const authRefreshRes = await request(url)
					.post('/auth/refresh')
					.set('Authorization', `Bearer ${access_token}`)
					.send({ mode: 'json' });

				expect(authRefreshRes.status).toBe(403);

				// /auth/logout should reject the OAuth token
				const authLogoutRes = await request(url)
					.post('/auth/logout')
					.set('Authorization', `Bearer ${access_token}`)
					.send({ mode: 'json' });

				expect(authLogoutRes.status).toBe(403);
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Regular Directus sessions still work on /mcp
	// -------------------------------------------------------------------------
	describe('regular sessions accessing /mcp', () => {
		it.each(vendors)(
			'%s - regular Directus access_token can reach /mcp',
			async (vendor) => {
				const url = getUrl(vendor);

				// Login with json mode to get a regular access_token
				const loginRes = await request(url)
					.post('/auth/login')
					.send({ email: USER.ADMIN.EMAIL, password: USER.ADMIN.PASSWORD })
					.expect(200);

				const { access_token } = loginRes.body.data as { access_token: string };

				// /mcp should not reject a regular admin token with 401/403
				const mcpRes = await request(url)
					.post('/mcp')
					.set('Authorization', `Bearer ${access_token}`)
					.set('Accept', 'application/json')
					.send({ jsonrpc: '2.0', method: 'tools/list', id: 1 });

				expect(mcpRes.status).toBe(200);
			},
			30_000,
		);
	});

	// -------------------------------------------------------------------------
	// Concurrent refresh - only one winner
	// -------------------------------------------------------------------------
	describe('concurrent refresh', () => {
		it.each(vendors)(
			'%s - only one concurrent refresh wins with the same token',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-concurrent-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);
				const tokens = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);
				const { refresh_token } = tokens;

				// Fire two refreshes simultaneously with the same token
				const [res1, res2] = await Promise.all([
					request(url)
						.post('/mcp-oauth/token')
						.type('form')
						.send({ grant_type: 'refresh_token', client_id: clientId, refresh_token, resource: `${url}/mcp` }),
					request(url)
						.post('/mcp-oauth/token')
						.type('form')
						.send({ grant_type: 'refresh_token', client_id: clientId, refresh_token, resource: `${url}/mcp` }),
				]);

				const statuses = [res1.status, res2.status];

				// Exactly one should succeed (200), exactly one should fail (400)
				expect(statuses.sort()).toEqual([200, 400]);

				const failedRes = res1.status === 400 ? res1 : res2;
				expect(failedRes.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Refresh token reuse revokes the surviving grant
	// -------------------------------------------------------------------------
	describe('refresh token reuse detection', () => {
		it.each(vendors)(
			'%s - replaying an old refresh token revokes the entire grant',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-reuse-detect-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);
				const tokens = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);
				const refreshToken1 = tokens.refresh_token;

				// Step 2: Refresh with refresh_token_1 -> get refresh_token_2
				const refreshRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'refresh_token',
						client_id: clientId,
						refresh_token: refreshToken1,
						resource: `${url}/mcp`,
					})
					.expect(200);

				const refreshToken2 = refreshRes.body.refresh_token as string;
				expect(refreshToken2).not.toBe(refreshToken1);

				// Step 3: Replay the OLD refresh_token_1 -> should fail (reuse detected)
				const replayRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'refresh_token',
						client_id: clientId,
						refresh_token: refreshToken1,
						resource: `${url}/mcp`,
					});

				expect(replayRes.status).toBe(400);
				expect(replayRes.body.error).toBe('invalid_grant');

				// Step 4: Try the NEW refresh_token_2 -> should ALSO fail (grant revoked)
				const newTokenRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'refresh_token',
						client_id: clientId,
						refresh_token: refreshToken2,
						resource: `${url}/mcp`,
					});

				expect(newTokenRes.status).toBe(400);
				expect(newTokenRes.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Authorization code cannot be reused
	// -------------------------------------------------------------------------
	describe('authorization code reuse', () => {
		it.each(vendors)(
			'%s - authorization code can only be used once',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-reuse-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);

				// First use succeeds
				await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);

				// Second use with the same code must fail
				const secondRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'authorization_code',
						client_id: clientId,
						code,
						redirect_uri: redirectUri,
						code_verifier: pkce.verifier,
						resource: `${url}/mcp`,
					});

				expect(secondRes.status).toBe(400);
				expect(secondRes.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Authorization code binding (client_id + redirect_uri)
	// -------------------------------------------------------------------------
	describe('authorization code binding', () => {
		it.each(vendors)(
			'%s - code exchange fails with wrong client_id',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-binding-callback`;

				// Register two clients with the same redirect_uri
				const clientA = await registerClient(url, { redirectUri });
				const clientB = await registerClient(url, { redirectUri });

				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();

				// Authorize with client A
				const code = await authorize(url, cookies, clientA, redirectUri, pkce);

				// Try to exchange using client B's client_id
				const res = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'authorization_code',
						client_id: clientB,
						code,
						redirect_uri: redirectUri,
						code_verifier: pkce.verifier,
						resource: `${url}/mcp`,
					});

				expect(res.status).toBe(400);
				expect(res.body.error).toBe('invalid_grant');
			},
			60_000,
		);

		it.each(vendors)(
			'%s - code exchange fails with wrong redirect_uri',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUriX = `${url}/mcp-oauth-binding-redir-x`;
				const redirectUriY = `${url}/mcp-oauth-binding-redir-y`;

				// Register client with redirect_uri X
				const clientId = await registerClient(url, { redirectUri: redirectUriX });

				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();

				// Authorize with redirect_uri X
				const code = await authorize(url, cookies, clientId, redirectUriX, pkce);

				// Try to exchange with a different redirect_uri Y
				const res = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'authorization_code',
						client_id: clientId,
						code,
						redirect_uri: redirectUriY,
						code_verifier: pkce.verifier,
						resource: `${url}/mcp`,
					});

				expect(res.status).toBe(400);
				expect(res.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Token revocation
	// -------------------------------------------------------------------------
	describe('POST /mcp-oauth/revoke', () => {
		it.each(vendors)(
			'%s - revoke refresh_token invalidates subsequent refresh',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-revoke-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);
				const tokens = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);
				const { refresh_token } = tokens;

				// Revoke
				await request(url)
					.post('/mcp-oauth/revoke')
					.type('form')
					.send({ token: refresh_token, client_id: clientId })
					.expect(200);

				// Refresh after revocation should fail
				const refreshAfterRevokeRes = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({ grant_type: 'refresh_token', client_id: clientId, refresh_token, resource: `${url}/mcp` });

				expect(refreshAfterRevokeRes.status).toBe(400);
				expect(refreshAfterRevokeRes.body.error).toBe('invalid_grant');
			},
			60_000,
		);

		it.each(vendors)('%s - revoke unknown token returns 200 (per RFC 7009)', async (vendor) => {
			const url = getUrl(vendor);
			const clientId = await registerClient(url);

			// Revoking a non-existent token must still return 200
			await request(url)
				.post('/mcp-oauth/revoke')
				.type('form')
				.send({ token: 'non_existent_token_xyz', client_id: clientId })
				.expect(200);
		});
	});

	// -------------------------------------------------------------------------
	// PKCE enforcement
	// -------------------------------------------------------------------------
	describe('PKCE enforcement', () => {
		it.each(vendors)(
			'%s - token exchange fails with wrong code_verifier',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-pkce-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);

				// Use a different verifier
				const wrongVerifier = crypto.randomBytes(32).toString('hex');

				const res = await request(url)
					.post('/mcp-oauth/token')
					.type('form')
					.send({
						grant_type: 'authorization_code',
						client_id: clientId,
						code,
						redirect_uri: redirectUri,
						code_verifier: wrongVerifier,
						resource: `${url}/mcp`,
					});

				expect(res.status).toBe(400);
				expect(res.body.error).toBe('invalid_grant');
			},
			60_000,
		);
	});

	// -------------------------------------------------------------------------
	// Deny flow
	// -------------------------------------------------------------------------
	describe('authorization denial', () => {
		it.each(vendors)(
			'%s - denying authorization redirects with access_denied',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-deny-callback`;

				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();

				// Get consent page
				const consentRes = await request(url)
					.get('/mcp-oauth/authorize')
					.set('Cookie', cookies)
					.query({
						client_id: clientId,
						redirect_uri: redirectUri,
						response_type: 'code',
						code_challenge: pkce.challenge,
						code_challenge_method: 'S256',
						scope: 'mcp:access',
						resource: `${url}/mcp`,
					})
					.expect(200);

				const signed_params = extractSignedParams(consentRes.text);

				// Deny
				const decisionRes = await request(url)
					.post('/mcp-oauth/authorize/decision')
					.set('Cookie', cookies)
					.set('Origin', url)
					.type('form')
					.send({ signed_params, approved: 'false' })
					.expect(302);

				const location = decisionRes.headers['location'] as string;
				const redirectUrl = new URL(location);
				expect(redirectUrl.searchParams.get('error')).toBe('access_denied');
				expect(redirectUrl.searchParams.get('iss')).toBe(url);
			},
			30_000,
		);
	});

	// -------------------------------------------------------------------------
	// WebSocket guard (OAuth sessions rejected)
	// -------------------------------------------------------------------------
	describe('WebSocket guard', () => {
		it.each(vendors)(
			'%s - OAuth scope token rejected on WebSocket',
			async (vendor) => {
				const url = getUrl(vendor);
				const redirectUri = `${url}/mcp-oauth-ws-callback`;

				// Get an OAuth access_token
				const clientId = await registerClient(url, { redirectUri });
				const cookies = await loginAsAdmin(url);
				const pkce = generatePKCE();
				const code = await authorize(url, cookies, clientId, redirectUri, pkce);
				const { access_token } = await exchangeCode(url, clientId, code, redirectUri, pkce.verifier);

				// Connect via real WebSocket and attempt auth with OAuth token
				const wsHost = url.replace(/^http/, 'ws');

				const result = await new Promise<string>((resolve) => {
					const ws = new WebSocket(`${wsHost}/websocket`);

					ws.on('open', () => {
						ws.send(JSON.stringify({ type: 'auth', access_token }));
					});

					ws.on('message', (data: Buffer) => {
						const msg = JSON.parse(data.toString());

						if (msg.type === 'auth' && msg.status === 'error') {
							ws.close();
							resolve('rejected');
						} else if (msg.type === 'auth' && msg.status === 'ok') {
							ws.close();
							resolve('accepted');
						}
					});

					ws.on('error', () => resolve('error'));

					setTimeout(() => {
						ws.close();
						resolve('timeout');
					}, 5000);
				});

				expect(result).toBe('rejected');
			},
			30_000,
		);
	});
});
