import crypto from 'node:crypto';
import { beforeAll, describe, expect, test } from 'vitest';
import {
	approvePublicClientConsent,
	authorizePublicClient,
	baseUrl,
	createOAuthTokens,
	enableMcpOAuthSettings,
	exchangeCode,
	expectJsonResponse,
	expectTextResponse,
	extractSignedParams,
	fetchPublicClientConsentPage,
	generatePKCE,
	getResourceUrl,
	loginAsAdminSession,
	loginAsAdminToken,
	openWebSocket,
	postForm,
	postJson,
	postMcpToolsList,
	postMcpToolsListWithQueryToken,
	refreshToken,
	registerPublicClient,
	revokeToken,
} from './mcp-oauth-utils.js';

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

describe('/mcp-oauth discovery endpoints', () => {
	test('GET /.well-known/oauth-protected-resource', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
		const body = await expectJsonResponse(response, 200);

		expect(body).toMatchObject({
			resource: getResourceUrl(),
			authorization_servers: [baseUrl],
			scopes_supported: ['mcp:access'],
			bearer_methods_supported: ['header'],
		});
	});

	test('GET /.well-known/oauth-protected-resource/mcp uses path insertion', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource/mcp`);
		const body = await expectJsonResponse(response, 200);

		expect(body).toMatchObject({
			resource: getResourceUrl(),
			authorization_servers: [baseUrl],
			scopes_supported: ['mcp:access'],
			bearer_methods_supported: ['header'],
		});
	});

	test('GET /.well-known/oauth-authorization-server', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
		const body = await expectJsonResponse(response, 200);

		expect(body).toMatchObject({
			issuer: baseUrl,
			authorization_endpoint: `${baseUrl}/mcp-oauth/authorize`,
			token_endpoint: `${baseUrl}/mcp-oauth/token`,
			registration_endpoint: `${baseUrl}/mcp-oauth/register`,
			revocation_endpoint: `${baseUrl}/mcp-oauth/revoke`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
			scopes_supported: ['mcp:access'],
		});
	});

	test('GET /.well-known/oauth-authorization-server/mcp uses path insertion', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server/mcp`);
		const body = await expectJsonResponse(response, 200);

		expect(body).toMatchObject({
			issuer: baseUrl,
			token_endpoint: `${baseUrl}/mcp-oauth/token`,
		});
	});

	test('discovery ignores invalid bearer tokens because it is public OAuth metadata', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`, {
			headers: { Authorization: 'Bearer invalid-token' },
		});

		const body = await expectJsonResponse(response, 200);

		expect(body).toMatchObject({
			issuer: baseUrl,
			token_endpoint: `${baseUrl}/mcp-oauth/token`,
		});
	});
});

describe('POST /mcp-oauth/register', () => {
	test('registers a public client', async () => {
		const response = await postJson('/mcp-oauth/register', {
			client_name: 'Test MCP Client',
			redirect_uris: [`${baseUrl}/callback`],
			grant_types: ['authorization_code', 'refresh_token'],
			token_endpoint_auth_method: 'none',
			client_uri: 'https://client.example.com',
			logo_uri: 'https://client.example.com/logo.png',
			tos_uri: 'https://client.example.com/terms',
			policy_uri: 'https://client.example.com/privacy',
		});

		const body = await expectJsonResponse(response, 201);

		expect(body).toMatchObject({
			client_id: expect.any(String),
			client_name: 'Test MCP Client',
			redirect_uris: [`${baseUrl}/callback`],
			grant_types: ['authorization_code', 'refresh_token'],
			response_types: ['code'],
			token_endpoint_auth_method: 'none',
			client_id_issued_at: expect.any(Number),
			client_uri: 'https://client.example.com',
			logo_uri: 'https://client.example.com/logo.png',
			tos_uri: 'https://client.example.com/terms',
			policy_uri: 'https://client.example.com/privacy',
		});
	});

	test('defaults omitted grant_types to authorization_code', async () => {
		const response = await postJson('/mcp-oauth/register', {
			client_name: 'Default Grant MCP Client',
			redirect_uris: [`${baseUrl}/callback-default-grant`],
			token_endpoint_auth_method: 'none',
		});

		const body = await expectJsonResponse(response, 201);

		expect(body).toMatchObject({
			client_id: expect.any(String),
			grant_types: ['authorization_code'],
			response_types: ['code'],
		});
	});

	test('rejects missing client_name', async () => {
		const response = await postJson('/mcp-oauth/register', {
			redirect_uris: [`${baseUrl}/callback`],
			grant_types: ['authorization_code'],
			token_endpoint_auth_method: 'none',
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_client_metadata');
	});

	test('rejects missing redirect_uris', async () => {
		const response = await postJson('/mcp-oauth/register', {
			client_name: 'Test',
			grant_types: ['authorization_code'],
			token_endpoint_auth_method: 'none',
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_redirect_uri');
	});
});

describe('full OAuth flow', () => {
	test('registers, authorizes, exchanges, refreshes, and revokes', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		expect(tokens).toMatchObject({
			access_token: expect.any(String),
			token_type: 'Bearer',
			expires_in: expect.any(Number),
			refresh_token: expect.any(String),
			scope: 'mcp:access',
		});

		const mcpResponse = await postMcpToolsList(tokens.access_token);
		expect(mcpResponse.status).toBe(200);

		const refreshResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		const refreshedTokens = (await expectJsonResponse(refreshResponse, 200)) as typeof tokens;

		expect(refreshedTokens).toMatchObject({
			access_token: expect.any(String),
			token_type: 'Bearer',
			expires_in: expect.any(Number),
			refresh_token: expect.any(String),
			scope: 'mcp:access',
		});

		expect(refreshedTokens.access_token).not.toBe(tokens.access_token);
		expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token);

		await expectJsonResponse(await revokeToken({ clientId, token: refreshedTokens.refresh_token }), 200);

		const afterRevokeResponse = await refreshToken({ clientId, refreshToken: refreshedTokens.refresh_token });
		const afterRevokeBody = (await expectJsonResponse(afterRevokeResponse, 400)) as { error?: string };

		expect(afterRevokeBody.error).toBe('invalid_grant');
	});

	test('supports default custom-scheme MCP desktop redirects', async () => {
		const redirectUri = 'raycast://oauth?package_name=directus';
		const clientId = await registerPublicClient({ redirectUri });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const consentResponse = await fetchPublicClientConsentPage({ clientId, redirectUri, pkce, cookies });

		const csp = consentResponse.headers.get('content-security-policy');
		expect(csp).toContain('form-action');
		expect(csp).toContain('raycast:');

		const signed_params = extractSignedParams(await expectTextResponse(consentResponse, 200));

		const decisionResponse = await approvePublicClientConsent({ signedParams: signed_params, cookies });

		expect(decisionResponse.status).toBe(302);

		const location = decisionResponse.headers.get('location');
		expect(location).toBeTruthy();
		expect(location).toMatch(/^raycast:\/\/oauth\?/);

		const redirectUrl = new URL(location!);
		const code = redirectUrl.searchParams.get('code');

		expect(redirectUrl.searchParams.get('package_name')).toBe('directus');
		expect(code).toBeTruthy();
		expect(redirectUrl.searchParams.get('iss')).toBe(baseUrl);

		const tokens = await exchangeCode({ clientId, code: code!, redirectUri, codeVerifier: pkce.verifier });

		expect(tokens).toMatchObject({
			access_token: expect.any(String),
			token_type: 'Bearer',
			refresh_token: expect.any(String),
			scope: 'mcp:access',
		});
	});

	test('supports Cursor desktop OAuth redirect registration shape', async () => {
		const redirectUri = 'cursor://anysphere.cursor-mcp/callback';

		const clientId = await registerPublicClient({
			redirectUri,
			redirectUris: [redirectUri, 'https://www.cursor.com/callback', 'http://localhost:3000/callback'],
		});

		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const consentResponse = await fetchPublicClientConsentPage({ clientId, redirectUri, pkce, cookies });

		const csp = consentResponse.headers.get('content-security-policy');
		expect(csp).toContain('form-action');
		expect(csp).toContain('cursor:');

		const signed_params = extractSignedParams(await expectTextResponse(consentResponse, 200));

		const decisionResponse = await approvePublicClientConsent({ signedParams: signed_params, cookies });

		expect(decisionResponse.status).toBe(302);

		const location = decisionResponse.headers.get('location');
		expect(location).toBeTruthy();
		expect(location).toMatch(/^cursor:\/\/anysphere\.cursor-mcp\/callback\?/);

		const redirectUrl = new URL(location!);
		const code = redirectUrl.searchParams.get('code');

		expect(code).toBeTruthy();
		expect(redirectUrl.searchParams.get('iss')).toBe(baseUrl);

		const tokens = await exchangeCode({ clientId, code: code!, redirectUri, codeVerifier: pkce.verifier });

		expect(tokens).toMatchObject({
			access_token: expect.any(String),
			token_type: 'Bearer',
			refresh_token: expect.any(String),
			scope: 'mcp:access',
		});
	});
});

describe('OAuth token isolation', () => {
	test('OAuth access_token cannot access non-MCP endpoints', async () => {
		const { tokens } = await createOAuthTokens();

		const itemsResponse = await fetch(`${baseUrl}/items/directus_users`, {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		});

		expect(itemsResponse.status).toBe(403);

		const graphqlResponse = await postJson(
			'/graphql',
			{ query: '{ __typename }' },
			{ headers: { Authorization: `Bearer ${tokens.access_token}` } },
		);

		expect(graphqlResponse.status).toBe(403);

		const authRefreshResponse = await postJson(
			'/auth/refresh',
			{ mode: 'json' },
			{ headers: { Authorization: `Bearer ${tokens.access_token}` } },
		);

		expect(authRefreshResponse.status).toBe(403);

		const authLogoutResponse = await postJson(
			'/auth/logout',
			{ mode: 'json' },
			{ headers: { Authorization: `Bearer ${tokens.access_token}` } },
		);

		expect(authLogoutResponse.status).toBe(403);
	});

	test('OAuth refresh_token cannot be used as a regular Directus refresh token', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		const authRefreshResponse = await postJson('/auth/refresh', { refresh_token: tokens.refresh_token });

		expect(authRefreshResponse.status).toBe(401);

		const mcpRefreshResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		await expectJsonResponse(mcpRefreshResponse, 200);
	});

	test('regular Directus logout ignores OAuth refresh_token without revoking the OAuth grant', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		const authLogoutResponse = await postJson('/auth/logout', { refresh_token: tokens.refresh_token });

		expect(authLogoutResponse.status).toBe(204);

		const mcpRefreshResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		await expectJsonResponse(mcpRefreshResponse, 200);
	});
});

describe('regular Directus tokens accessing /mcp', () => {
	test('regular Directus access_token can reach /mcp', async () => {
		const accessToken = await loginAsAdminToken();
		const response = await postMcpToolsList(accessToken);

		expect(response.status).toBe(200);
	});

	test('static API key can reach /mcp via Authorization header', async () => {
		const response = await postMcpToolsList('admin');

		expect(response.status).toBe(200);
	});

	test('static API key can reach /mcp via access_token query parameter', async () => {
		const response = await postMcpToolsListWithQueryToken('admin');

		expect(response.status).toBe(200);
	});
});

describe('concurrent refresh', () => {
	test('only one concurrent refresh wins with the same token', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		const [responseA, responseB] = await Promise.all([
			refreshToken({ clientId, refreshToken: tokens.refresh_token }),
			refreshToken({ clientId, refreshToken: tokens.refresh_token }),
		]);

		const statuses = [responseA.status, responseB.status].sort();

		expect(statuses).toEqual([200, 400]);

		const failedResponse = responseA.status === 400 ? responseA : responseB;
		const failedBody = (await expectJsonResponse(failedResponse, 400)) as { error?: string };

		expect(failedBody.error).toBe('invalid_grant');
	});
});

describe('public OAuth route ordering', () => {
	test('token endpoint returns OAuth invalid_request instead of Directus invalid_token for invalid bearer auth', async () => {
		const response = await postForm(
			'/mcp-oauth/token',
			{},
			{
				headers: { Authorization: 'Bearer invalid-token' },
			},
		);

		const body = (await expectJsonResponse(response, 400)) as { error?: string; error_description?: string };

		expect(body).toMatchObject({
			error: 'invalid_request',
			error_description: 'grant_type is required',
		});
	});
});

describe('refresh token reuse detection', () => {
	test('replaying an old refresh token revokes the entire grant', async () => {
		const { clientId, tokens } = await createOAuthTokens();
		const refreshResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		const refreshedTokens = (await expectJsonResponse(refreshResponse, 200)) as typeof tokens;

		expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token);

		const replayResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		const replayBody = (await expectJsonResponse(replayResponse, 400)) as { error?: string };

		expect(replayBody.error).toBe('invalid_grant');

		const newTokenResponse = await refreshToken({ clientId, refreshToken: refreshedTokens.refresh_token });
		const newTokenBody = (await expectJsonResponse(newTokenResponse, 400)) as { error?: string };

		expect(newTokenBody.error).toBe('invalid_grant');
	});
});

describe('authorization code reuse', () => {
	test('authorization code can only be used once', async () => {
		const redirectUri = `${baseUrl}/mcp-oauth-reuse-callback`;
		const clientId = await registerPublicClient({ redirectUri });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();
		const code = await authorizePublicClient({ clientId, redirectUri, pkce, cookies });

		await exchangeCode({ clientId, code, redirectUri, codeVerifier: pkce.verifier });

		const secondResponse = await postForm('/mcp-oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientId,
			code,
			redirect_uri: redirectUri,
			code_verifier: pkce.verifier,
			resource: getResourceUrl(),
		});

		const secondBody = (await expectJsonResponse(secondResponse, 400)) as { error?: string };

		expect(secondBody.error).toBe('invalid_grant');
	});
});

describe('authorization code binding', () => {
	test('code exchange fails with wrong client_id', async () => {
		const redirectUri = `${baseUrl}/mcp-oauth-binding-callback`;
		const clientA = await registerPublicClient({ redirectUri });
		const clientB = await registerPublicClient({ redirectUri });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();
		const code = await authorizePublicClient({ clientId: clientA, redirectUri, pkce, cookies });

		const response = await postForm('/mcp-oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientB,
			code,
			redirect_uri: redirectUri,
			code_verifier: pkce.verifier,
			resource: getResourceUrl(),
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_grant');
	});

	test('code exchange fails with wrong redirect_uri', async () => {
		const redirectUriA = `${baseUrl}/mcp-oauth-binding-redir-a`;
		const redirectUriB = `${baseUrl}/mcp-oauth-binding-redir-b`;
		const clientId = await registerPublicClient({ redirectUri: redirectUriA });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();
		const code = await authorizePublicClient({ clientId, redirectUri: redirectUriA, pkce, cookies });

		const response = await postForm('/mcp-oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientId,
			code,
			redirect_uri: redirectUriB,
			code_verifier: pkce.verifier,
			resource: getResourceUrl(),
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_grant');
	});
});

describe('POST /mcp-oauth/revoke', () => {
	test('revoke refresh_token invalidates subsequent refresh', async () => {
		const { clientId, tokens } = await createOAuthTokens();

		await expectJsonResponse(await revokeToken({ clientId, token: tokens.refresh_token }), 200);

		const refreshAfterRevokeResponse = await refreshToken({ clientId, refreshToken: tokens.refresh_token });
		const body = (await expectJsonResponse(refreshAfterRevokeResponse, 400)) as { error?: string };

		expect(body.error).toBe('invalid_grant');
	});

	test('revoke unknown token returns 200 per RFC 7009', async () => {
		const clientId = await registerPublicClient();

		await expectJsonResponse(await revokeToken({ clientId, token: 'non_existent_token_xyz' }), 200);
	});
});

describe('PKCE enforcement', () => {
	test('token exchange fails with wrong code_verifier', async () => {
		const redirectUri = `${baseUrl}/mcp-oauth-pkce-callback`;
		const clientId = await registerPublicClient({ redirectUri });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();
		const code = await authorizePublicClient({ clientId, redirectUri, pkce, cookies });
		const wrongVerifier = crypto.randomBytes(32).toString('hex');

		const response = await postForm('/mcp-oauth/token', {
			grant_type: 'authorization_code',
			client_id: clientId,
			code,
			redirect_uri: redirectUri,
			code_verifier: wrongVerifier,
			resource: getResourceUrl(),
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_grant');
	});
});

describe('authorization denial', () => {
	test('denying authorization redirects with access_denied', async () => {
		const redirectUri = `${baseUrl}/mcp-oauth-deny-callback`;
		const clientId = await registerPublicClient({ redirectUri });
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();
		const authorizeUrl = new URL(`${baseUrl}/mcp-oauth/authorize`);

		authorizeUrl.searchParams.set('client_id', clientId);
		authorizeUrl.searchParams.set('redirect_uri', redirectUri);
		authorizeUrl.searchParams.set('response_type', 'code');
		authorizeUrl.searchParams.set('code_challenge', pkce.challenge);
		authorizeUrl.searchParams.set('code_challenge_method', 'S256');
		authorizeUrl.searchParams.set('scope', 'mcp:access');
		authorizeUrl.searchParams.set('resource', getResourceUrl());

		const consentResponse = await fetch(authorizeUrl, {
			headers: { Cookie: cookies },
		});

		const signed_params = extractSignedParams(await expectTextResponse(consentResponse, 200));

		const decisionResponse = await postForm(
			'/mcp-oauth/authorize/decision',
			{ signed_params, approved: 'false' },
			{
				redirect: 'manual',
				headers: {
					Cookie: cookies,
					Origin: baseUrl,
				},
			},
		);

		expect(decisionResponse.status).toBe(302);

		const location = decisionResponse.headers.get('location');
		expect(location).toBeTruthy();

		const redirectUrl = new URL(location!);
		expect(redirectUrl.searchParams.get('error')).toBe('access_denied');
		expect(redirectUrl.searchParams.get('iss')).toBe(baseUrl);
	});
});

describe('WebSocket guard', () => {
	test('OAuth scoped token is rejected on /websocket auth', async () => {
		const { tokens } = await createOAuthTokens();
		const socket = await openWebSocket();

		try {
			const result = await new Promise<string>((resolve) => {
				const timeout = setTimeout(() => {
					socket.close();
					resolve('timeout');
				}, 5_000);

				socket.addEventListener('message', (event) => {
					const message = JSON.parse(String(event.data)) as {
						type?: string;
						status?: string;
					};

					if (message.type === 'auth' && message.status === 'error') {
						clearTimeout(timeout);
						resolve('rejected');
					}

					if (message.type === 'auth' && message.status === 'ok') {
						clearTimeout(timeout);
						resolve('accepted');
					}
				});

				socket.send(JSON.stringify({ type: 'auth', access_token: tokens.access_token }));
			});

			expect(result).toBe('rejected');
		} finally {
			socket.close();
		}
	});

	test('OAuth scoped token is rejected on /websocket access_token query auth', async () => {
		const { tokens } = await createOAuthTokens();
		const wsUrl = baseUrl.replace(/^http/, 'ws');
		const socket = new WebSocket(`${wsUrl}/websocket?access_token=${encodeURIComponent(tokens.access_token)}`);

		const result = await new Promise<string>((resolve) => {
			const timeout = setTimeout(() => {
				socket.close();
				resolve('timeout');
			}, 5_000);

			socket.addEventListener(
				'open',
				() => {
					clearTimeout(timeout);
					socket.close();
					resolve('accepted');
				},
				{ once: true },
			);

			socket.addEventListener(
				'close',
				() => {
					clearTimeout(timeout);
					resolve('rejected');
				},
				{ once: true },
			);

			socket.addEventListener(
				'error',
				() => {
					clearTimeout(timeout);
					resolve('rejected');
				},
				{ once: true },
			);
		});

		expect(result).toBe('rejected');
	});

	test('static API key can connect to /websocket with access_token query auth', async () => {
		const wsUrl = baseUrl.replace(/^http/, 'ws');
		const socket = new WebSocket(`${wsUrl}/websocket?access_token=admin`);

		try {
			const result = await new Promise<string>((resolve) => {
				const timeout = setTimeout(() => {
					socket.close();
					resolve('timeout');
				}, 5_000);

				socket.addEventListener(
					'open',
					() => {
						clearTimeout(timeout);
						resolve('accepted');
					},
					{ once: true },
				);

				socket.addEventListener(
					'close',
					() => {
						clearTimeout(timeout);
						resolve('rejected');
					},
					{ once: true },
				);

				socket.addEventListener(
					'error',
					() => {
						clearTimeout(timeout);
						resolve('rejected');
					},
					{ once: true },
				);
			});

			expect(result).toBe('accepted');
		} finally {
			socket.close();
		}
	});
});
