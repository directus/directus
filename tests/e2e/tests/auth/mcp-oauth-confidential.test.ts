import { beforeAll, describe, expect, test } from 'vitest';
import {
	authorizePublicClient,
	baseUrl,
	basicClientAuthHeader,
	enableMcpOAuthSettings,
	exchangeCode,
	expectJsonResponse,
	generatePKCE,
	getResourceUrl,
	loginAsAdminSession,
	postForm,
	postJson,
	postMcpToolsList,
	refreshToken,
	registerConfidentialClient,
	revokeToken,
} from './mcp-oauth-utils.js';

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

async function authorizeConfidentialClient(args: { clientId: string; redirectUri: string }) {
	const cookies = await loginAsAdminSession();
	const pkce = generatePKCE();

	const code = await authorizePublicClient({
		clientId: args.clientId,
		redirectUri: args.redirectUri,
		pkce,
		cookies,
	});

	return { code, pkce };
}

describe('POST /mcp-oauth/register confidential clients', () => {
	test('defaults omitted token_endpoint_auth_method to client_secret_basic', async () => {
		const redirectUri = `${baseUrl}/mcp-oauth-confidential-default-callback`;

		const response = await postJson('/mcp-oauth/register', {
			client_name: 'Default Confidential Client',
			redirect_uris: [redirectUri],
			grant_types: ['authorization_code', 'refresh_token'],
		});

		const body = (await expectJsonResponse(response, 201)) as {
			client_id?: string;
			client_secret?: string;
			client_secret_expires_at?: number;
			token_endpoint_auth_method?: string;
		};

		expect(body).toMatchObject({
			client_id: expect.any(String),
			client_secret: expect.any(String),
			client_secret_expires_at: 0,
			token_endpoint_auth_method: 'client_secret_basic',
		});
	});
});

describe('client_secret_basic confidential client flow', () => {
	test('authenticates token, refresh, and revoke requests with HTTP Basic', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-confidential-basic-callback`,
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const { code, pkce } = await authorizeConfidentialClient(client);
		const authorizationHeader = basicClientAuthHeader(client.clientId, client.clientSecret);

		const tokens = await exchangeCode({
			clientId: client.clientId,
			code,
			redirectUri: client.redirectUri,
			codeVerifier: pkce.verifier,
			authorizationHeader,
		});

		const mcpResponse = await postMcpToolsList(tokens.access_token);
		expect(mcpResponse.status).toBe(200);

		const refreshResponse = await refreshToken({
			clientId: client.clientId,
			refreshToken: tokens.refresh_token,
			authorizationHeader,
		});

		const refreshedTokens = (await expectJsonResponse(refreshResponse, 200)) as typeof tokens;

		expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token);

		await expectJsonResponse(
			await revokeToken({
				clientId: client.clientId,
				token: refreshedTokens.refresh_token,
				authorizationHeader,
			}),
			200,
		);

		const afterRevokeResponse = await refreshToken({
			clientId: client.clientId,
			refreshToken: refreshedTokens.refresh_token,
			authorizationHeader,
		});

		const afterRevokeBody = (await expectJsonResponse(afterRevokeResponse, 400)) as { error?: string };

		expect(afterRevokeBody.error).toBe('invalid_grant');
	});

	test('rejects token requests without Authorization header', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-confidential-basic-missing-header`,
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const response = await postForm('/mcp-oauth/token', {
			grant_type: 'authorization_code',
			client_id: client.clientId,
			code: 'invalid-code',
			redirect_uri: client.redirectUri,
			code_verifier: 'a'.repeat(43),
			resource: getResourceUrl(),
		});

		const body = (await expectJsonResponse(response, 401)) as { error?: string };

		expect(body.error).toBe('invalid_client');
		expect(response.headers.get('www-authenticate')).toBe('Basic realm="directus"');
	});
});

describe('client_secret_post confidential client flow', () => {
	test('authenticates token, refresh, and revoke requests with client_secret body parameter', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-confidential-post-callback`,
			tokenEndpointAuthMethod: 'client_secret_post',
		});

		const { code, pkce } = await authorizeConfidentialClient(client);

		const tokens = await exchangeCode({
			clientId: client.clientId,
			code,
			redirectUri: client.redirectUri,
			codeVerifier: pkce.verifier,
			clientSecret: client.clientSecret,
		});

		const mcpResponse = await postMcpToolsList(tokens.access_token);
		expect(mcpResponse.status).toBe(200);

		const refreshResponse = await refreshToken({
			clientId: client.clientId,
			refreshToken: tokens.refresh_token,
			clientSecret: client.clientSecret,
		});

		const refreshedTokens = (await expectJsonResponse(refreshResponse, 200)) as typeof tokens;

		expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token);

		await expectJsonResponse(
			await revokeToken({
				clientId: client.clientId,
				token: refreshedTokens.refresh_token,
				clientSecret: client.clientSecret,
			}),
			200,
		);

		const afterRevokeResponse = await refreshToken({
			clientId: client.clientId,
			refreshToken: refreshedTokens.refresh_token,
			clientSecret: client.clientSecret,
		});

		const afterRevokeBody = (await expectJsonResponse(afterRevokeResponse, 400)) as { error?: string };

		expect(afterRevokeBody.error).toBe('invalid_grant');
	});

	test('rejects Authorization header for client_secret_post clients', async () => {
		const client = await registerConfidentialClient({
			redirectUri: `${baseUrl}/mcp-oauth-confidential-post-basic-header`,
			tokenEndpointAuthMethod: 'client_secret_post',
		});

		const response = await refreshToken({
			clientId: client.clientId,
			refreshToken: 'invalid-refresh-token',
			authorizationHeader: basicClientAuthHeader(client.clientId, client.clientSecret),
		});

		const body = (await expectJsonResponse(response, 400)) as { error?: string };

		expect(body.error).toBe('invalid_request');
	});
});
