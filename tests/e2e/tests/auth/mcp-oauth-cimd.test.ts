import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import {
	baseUrl,
	CimdMetadataServer,
	enableMcpOAuthSettings,
	exchangeCode,
	expectJsonResponse,
	expectTextResponse,
	extractCodeFromLocation,
	extractSignedParams,
	generatePKCE,
	getResourceUrl,
	loginAsAdminSession,
	postForm,
	postMcpToolsList,
	refreshToken,
	revokeToken,
} from './mcp-oauth-utils.js';

const redirectUri = 'http://127.0.0.1:9876/callback';
const metadataServers: CimdMetadataServer[] = [];

beforeAll(async () => {
	await enableMcpOAuthSettings();
});

afterEach(async () => {
	await Promise.all(metadataServers.splice(0).map((server) => server.stop()));
});

async function startMetadataServer(): Promise<CimdMetadataServer> {
	const server = new CimdMetadataServer();
	await server.start();
	metadataServers.push(server);
	return server;
}

async function fetchConsentPage(args: {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	cookies: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const authorizeUrl = new URL(`${apiUrl}/mcp-oauth/authorize`);

	authorizeUrl.searchParams.set('client_id', args.clientId);
	authorizeUrl.searchParams.set('redirect_uri', args.redirectUri);
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('code_challenge', args.codeChallenge);
	authorizeUrl.searchParams.set('code_challenge_method', 'S256');
	authorizeUrl.searchParams.set('scope', 'mcp:access');
	authorizeUrl.searchParams.set('resource', getResourceUrl(apiUrl));

	return fetch(authorizeUrl, {
		headers: {
			Cookie: args.cookies,
		},
	});
}

async function authorizeCimdClient(args: {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	cookies: string;
	apiUrl?: string;
}): Promise<{ code: string; html: string }> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const consentResponse = await fetchConsentPage(args);
	const html = await expectTextResponse(consentResponse, 200);
	const signed_params = extractSignedParams(html);

	const decisionResponse = await postForm(
		'/mcp-oauth/authorize/decision',
		{ signed_params, approved: 'true' },
		{
			redirect: 'manual',
			headers: {
				Cookie: args.cookies,
				Origin: apiUrl,
			},
		},
		apiUrl,
	);

	if (decisionResponse.status !== 302) {
		throw new Error(
			`Expected authorize decision redirect, got ${decisionResponse.status}: ${await decisionResponse.text()}`,
		);
	}

	const location = decisionResponse.headers.get('location');

	if (!location) throw new Error('No Location header in authorize decision response');

	return { code: extractCodeFromLocation(location), html };
}

describe('/mcp-oauth CIMD full OAuth flow', () => {
	test('authorizes, exchanges, refreshes, and revokes with a CIMD client_id', async () => {
		const metadataServer = await startMetadataServer();
		metadataServer.setDefaultMetadata();

		const clientId = metadataServer.getClientId();
		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const { code, html } = await authorizeCimdClient({
			clientId,
			redirectUri,
			codeChallenge: pkce.challenge,
			cookies,
		});

		expect(html).toContain('Test CIMD Client');

		const tokens = await exchangeCode({ clientId, code, redirectUri, codeVerifier: pkce.verifier });

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
});

describe('/mcp-oauth CIMD metadata validation', () => {
	test('rejects metadata whose client_id does not match the fetch URL', async () => {
		const metadataServer = await startMetadataServer();

		metadataServer.setMetadata({
			client_id: 'http://127.0.0.1:9999/wrong-url.json',
			client_name: 'Wrong Client ID',
			redirect_uris: [redirectUri],
			grant_types: ['authorization_code'],
			token_endpoint_auth_method: 'none',
		});

		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const response = await fetchConsentPage({
			clientId: metadataServer.getClientId(),
			redirectUri,
			codeChallenge: pkce.challenge,
			cookies,
		});

		const text = await expectTextResponse(response, 400);

		expect(text).toContain('client_id in document does not match fetch URL');
	});

	test('rejects metadata missing client_name', async () => {
		const metadataServer = await startMetadataServer();

		metadataServer.setMetadata({
			client_id: metadataServer.getClientId(),
			redirect_uris: [redirectUri],
			grant_types: ['authorization_code'],
			token_endpoint_auth_method: 'none',
		});

		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const response = await fetchConsentPage({
			clientId: metadataServer.getClientId(),
			redirectUri,
			codeChallenge: pkce.challenge,
			cookies,
		});

		const text = await expectTextResponse(response, 400);

		expect(text).toContain('client_name is required');
	});

	test('rejects metadata containing client_secret', async () => {
		const metadataServer = await startMetadataServer();

		metadataServer.setMetadata({
			client_id: metadataServer.getClientId(),
			client_name: 'Secret Client',
			client_secret: 'should-not-be-here',
			redirect_uris: [redirectUri],
			grant_types: ['authorization_code'],
			token_endpoint_auth_method: 'none',
		});

		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const response = await fetchConsentPage({
			clientId: metadataServer.getClientId(),
			redirectUri,
			codeChallenge: pkce.challenge,
			cookies,
		});

		const text = await expectTextResponse(response, 400);

		expect(text).toContain('CIMD documents must not contain client_secret');
	});
});

describe('/mcp-oauth CIMD cache behavior', () => {
	test('uses cached metadata for a second authorize request to the same client_id', async () => {
		const metadataServer = await startMetadataServer();
		metadataServer.setDefaultMetadata();

		const clientId = metadataServer.getClientId();
		const cookies = await loginAsAdminSession();
		const pkce1 = generatePKCE();

		await expectTextResponse(
			await fetchConsentPage({ clientId, redirectUri, codeChallenge: pkce1.challenge, cookies }),
			200,
		);

		expect(metadataServer.getRequestCount()).toBe(1);

		const pkce2 = generatePKCE();

		await expectTextResponse(
			await fetchConsentPage({ clientId, redirectUri, codeChallenge: pkce2.challenge, cookies }),
			200,
		);

		expect(metadataServer.getRequestCount()).toBe(1);
	});
});

describe('/mcp-oauth CIMD metadata advertising', () => {
	test('authorization server metadata advertises CIMD support when enabled', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
		const body = (await expectJsonResponse(response, 200)) as { client_id_metadata_document_supported?: boolean };

		expect(body.client_id_metadata_document_supported).toBe(true);
	});
});

describe('/mcp-oauth CIMD consent page', () => {
	test('shows the client host for CIMD clients', async () => {
		const metadataServer = await startMetadataServer();
		metadataServer.setDefaultMetadata();

		const cookies = await loginAsAdminSession();
		const pkce = generatePKCE();

		const response = await fetchConsentPage({
			clientId: metadataServer.getClientId(),
			redirectUri,
			codeChallenge: pkce.challenge,
			cookies,
		});

		const text = await expectTextResponse(response, 200);

		expect(text).toContain('localhost');
	});
});
