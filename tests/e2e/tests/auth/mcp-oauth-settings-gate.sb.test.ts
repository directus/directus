import { randomUUID } from 'node:crypto';
import { sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import {
	CimdMetadataServer,
	enableMcpOAuthSettings,
	expectJsonResponse,
	expectTextResponse,
	generatePKCE,
	getResourceUrl,
	loginAsAdminSession,
	patchSettings,
	postForm,
	postJson,
	postMcpToolsList,
	postMcpToolsListWithQueryToken,
} from './mcp-oauth-utils.js';

let directus: Awaited<ReturnType<typeof sandbox>>;
let apiUrl: string;
const metadataServers: CimdMetadataServer[] = [];

beforeAll(async () => {
	directus = await sandbox(database, {
		inspect: false,
		prefix: `mcp-oauth-settings-${getUID()}`,
		env: {
			MCP_ENABLED: 'true',
			MCP_OAUTH_ENABLED: 'true',
			MCP_OAUTH_DCR_ENABLED: 'true',
			MCP_OAUTH_CIMD_ENABLED: 'true',
			MCP_OAUTH_CIMD_ALLOW_HTTP: 'true',
			MCP_OAUTH_CIMD_BLOCKED_TLDS: 'onion',
			IMPORT_IP_DENY_LIST: '169.254.169.254',
			RATE_LIMITER_MCP_OAUTH_POINTS: '1000',
			RATE_LIMITER_MCP_OAUTH_DURATION: '60',
			DB_FILENAME: `directus_test_${getUID()}.db`,
		},
		docker: {
			suffix: getUID(),
		},
		cache: false,
	});

	apiUrl = `http://127.0.0.1:${directus.apis[0].port}`;
	await enableMcpOAuthSettings(apiUrl);
});

afterAll(async () => {
	await directus?.stop();
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

async function withMcpOAuthDisabled(run: () => Promise<void>) {
	await patchSettings({ mcp_oauth_enabled: false }, apiUrl);

	try {
		await run();
	} finally {
		await patchSettings({ mcp_oauth_enabled: true }, apiUrl);
	}
}

async function withCimdDisabled(run: () => Promise<void>) {
	await patchSettings({ mcp_oauth_cimd_enabled: false }, apiUrl);

	try {
		await run();
	} finally {
		await patchSettings({ mcp_oauth_cimd_enabled: true }, apiUrl);
	}
}

async function withDcrDisabled(run: () => Promise<void>) {
	await patchSettings({ mcp_oauth_dcr_enabled: false }, apiUrl);

	try {
		await run();
	} finally {
		await patchSettings({ mcp_oauth_dcr_enabled: true }, apiUrl);
	}
}

async function fetchCimdConsentPage(clientId: string): Promise<Response> {
	const cookies = await loginAsAdminSession(apiUrl);
	const pkce = generatePKCE();
	const authorizeUrl = new URL(`${apiUrl}/mcp-oauth/authorize`);

	authorizeUrl.searchParams.set('client_id', clientId);
	authorizeUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:9876/callback');
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('code_challenge', pkce.challenge);
	authorizeUrl.searchParams.set('code_challenge_method', 'S256');
	authorizeUrl.searchParams.set('scope', 'mcp:access');
	authorizeUrl.searchParams.set('resource', getResourceUrl(apiUrl));

	return fetch(authorizeUrl, {
		headers: {
			Cookie: cookies,
		},
	});
}

describe('/mcp-oauth settings gate', () => {
	test('POST /mcp-oauth/register returns 403 JSON when disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const response = await postJson(
				'/mcp-oauth/register',
				{
					client_name: 'test-disabled-client',
					redirect_uris: [`${apiUrl}/callback`],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
				},
				undefined,
				apiUrl,
			);

			const body = await expectJsonResponse(response, 403);

			expect(body).toMatchObject({ error: 'mcp_oauth_disabled' });
		});
	});

	test('POST /mcp-oauth/token returns 403 JSON when disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const response = await postForm(
				'/mcp-oauth/token',
				{
					grant_type: 'authorization_code',
					client_id: 'any-client-id',
					code: 'any-code',
					redirect_uri: `${apiUrl}/callback`,
					code_verifier: 'any-verifier',
				},
				undefined,
				apiUrl,
			);

			const body = await expectJsonResponse(response, 403);

			expect(body).toMatchObject({ error: 'mcp_oauth_disabled' });
		});
	});

	test('POST /mcp-oauth/revoke returns 403 JSON when disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const response = await postForm(
				'/mcp-oauth/revoke',
				{
					token: 'any-token',
					client_id: 'any-client-id',
				},
				undefined,
				apiUrl,
			);

			const body = await expectJsonResponse(response, 403);

			expect(body).toMatchObject({ error: 'mcp_oauth_disabled' });
		});
	});

	test('GET /mcp-oauth/authorize returns 403 HTML error page when disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const authorizeUrl = new URL(`${apiUrl}/mcp-oauth/authorize`);

			authorizeUrl.searchParams.set('client_id', 'any-client-id');
			authorizeUrl.searchParams.set('redirect_uri', `${apiUrl}/callback`);
			authorizeUrl.searchParams.set('response_type', 'code');
			authorizeUrl.searchParams.set('code_challenge', 'any-challenge');
			authorizeUrl.searchParams.set('code_challenge_method', 'S256');
			authorizeUrl.searchParams.set('scope', 'mcp:access');

			const response = await fetch(authorizeUrl);
			const text = await expectTextResponse(response, 403);

			expect(response.headers.get('content-type')).toMatch(/text\/html/);
			expect(text).toContain('MCP OAuth is disabled');
		});
	});

	test('GET /.well-known/oauth-authorization-server returns 403 JSON when disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const response = await fetch(`${apiUrl}/.well-known/oauth-authorization-server`);
			const body = await expectJsonResponse(response, 403);

			expect(body).toMatchObject({ error: 'mcp_oauth_disabled' });
		});
	});

	test('static API key can reach /mcp when MCP OAuth is disabled', async () => {
		await withMcpOAuthDisabled(async () => {
			const headerResponse = await postMcpToolsList('admin', apiUrl);
			const queryResponse = await postMcpToolsListWithQueryToken('admin', apiUrl);

			expect(headerResponse.status).toBe(200);
			expect(queryResponse.status).toBe(200);
		});
	});

	test('endpoints no longer return 403 after re-enabling', async () => {
		await patchSettings({ mcp_oauth_enabled: false }, apiUrl);

		const disabledResponse = await postJson(
			'/mcp-oauth/register',
			{
				client_name: 'test-reenable-client',
				redirect_uris: [`${apiUrl}/callback`],
				grant_types: ['authorization_code'],
				token_endpoint_auth_method: 'none',
			},
			undefined,
			apiUrl,
		);

		expect(disabledResponse.status).toBe(403);

		await patchSettings({ mcp_oauth_enabled: true }, apiUrl);

		const enabledResponse = await postJson(
			'/mcp-oauth/register',
			{
				client_name: 'test-reenable-client',
				redirect_uris: [`${apiUrl}/callback`],
				grant_types: ['authorization_code'],
				token_endpoint_auth_method: 'none',
			},
			undefined,
			apiUrl,
		);

		await expectJsonResponse(enabledResponse, 201);
	});

	test('GET /mcp-oauth/authorize returns 400 for CIMD client_id when CIMD is disabled', async () => {
		const metadataServer = await startMetadataServer();
		metadataServer.setDefaultMetadata();

		await withCimdDisabled(async () => {
			const response = await fetchCimdConsentPage(metadataServer.getClientId());
			const text = await expectTextResponse(response, 400);

			expect(text).toContain('CIMD client registration is disabled');
			expect(metadataServer.getRequestCount()).toBe(0);
		});
	});

	test('GET /mcp-oauth/authorize no longer returns disabled error after re-enabling CIMD', async () => {
		const metadataServer = await startMetadataServer();
		metadataServer.setDefaultMetadata();

		await patchSettings({ mcp_oauth_cimd_enabled: false }, apiUrl);
		await patchSettings({ mcp_oauth_cimd_enabled: true }, apiUrl);

		const response = await fetchCimdConsentPage(metadataServer.getClientId());
		const text = await expectTextResponse(response, 400);

		expect(text).toContain('Failed to fetch client metadata document');
		expect(text).not.toContain('CIMD client registration is disabled');
		expect(metadataServer.getRequestCount()).toBe(0);
	});

	test('GET /.well-known/oauth-authorization-server omits CIMD support when disabled', async () => {
		await withCimdDisabled(async () => {
			const response = await fetch(`${apiUrl}/.well-known/oauth-authorization-server`);

			const body = (await expectJsonResponse(response, 200)) as {
				client_id_metadata_document_supported?: boolean;
			};

			expect(body.client_id_metadata_document_supported).toBeUndefined();
		});
	});

	test('POST /mcp-oauth/register returns 404 JSON when DCR is disabled', async () => {
		await withDcrDisabled(async () => {
			const response = await postJson(
				'/mcp-oauth/register',
				{
					client_name: 'test-dcr-disabled',
					redirect_uris: [`${apiUrl}/callback`],
					grant_types: ['authorization_code'],
					token_endpoint_auth_method: 'none',
				},
				undefined,
				apiUrl,
			);

			const body = (await expectJsonResponse(response, 404)) as { error?: string };

			expect(body.error).toBe('not_found');
		});
	});

	test('POST /mcp-oauth/register allows DCR after re-enabling', async () => {
		await patchSettings({ mcp_oauth_dcr_enabled: false }, apiUrl);
		await patchSettings({ mcp_oauth_dcr_enabled: true }, apiUrl);

		const response = await postJson(
			'/mcp-oauth/register',
			{
				client_name: 'test-dcr-reenabled',
				redirect_uris: [`${apiUrl}/callback`],
				grant_types: ['authorization_code'],
				token_endpoint_auth_method: 'none',
			},
			undefined,
			apiUrl,
		);

		await expectJsonResponse(response, 201);
	});
});

describe('/mcp-oauth env gate', () => {
	test('OAuth routes are not mounted when MCP_OAUTH_ENABLED is false', async () => {
		// Resources must be unique vs. the beforeAll sandbox: same DB_FILENAME
		// gets unlinked by the docker step.
		const isolationId = randomUUID();

		const oauthDisabledDirectus = await sandbox(database, {
			inspect: false,
			prefix: `mcp-oauth-env-disabled-${isolationId}`,
			env: {
				MCP_ENABLED: 'true',
				MCP_OAUTH_ENABLED: 'false',
				RATE_LIMITER_MCP_OAUTH_POINTS: '1000',
				RATE_LIMITER_MCP_OAUTH_DURATION: '60',
				DB_FILENAME: `directus_test_env_${isolationId}.db`,
			},
			docker: {
				suffix: isolationId,
			},
			cache: false,
		});

		try {
			const disabledApiUrl = `http://127.0.0.1:${oauthDisabledDirectus.apis[0].port}`;

			for (const response of [
				await fetch(`${disabledApiUrl}/.well-known/oauth-authorization-server`),
				await postJson(
					'/mcp-oauth/register',
					{
						client_name: 'test-env-disabled-client',
						redirect_uris: [`${disabledApiUrl}/callback`],
						grant_types: ['authorization_code'],
						token_endpoint_auth_method: 'none',
					},
					undefined,
					disabledApiUrl,
				),
			]) {
				const body = (await expectJsonResponse(response, 404)) as {
					errors?: Array<{ extensions?: { code?: string } }>;
				};

				expect(body.errors?.[0]?.extensions?.code).toBe('ROUTE_NOT_FOUND');
			}
		} finally {
			await oauthDisabledDirectus.stop();
		}
	});
});
