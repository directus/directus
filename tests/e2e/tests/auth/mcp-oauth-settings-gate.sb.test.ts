import { sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
	enableMcpOAuthSettings,
	expectJsonResponse,
	expectTextResponse,
	patchSettings,
	postForm,
	postJson,
} from './mcp-oauth-utils.js';

let directus: Awaited<ReturnType<typeof sandbox>>;
let apiUrl: string;

beforeAll(async () => {
	directus = await sandbox(database, {
		inspect: false,
		prefix: `mcp-oauth-settings-${getUID()}`,
		env: {
			MCP_ENABLED: 'true',
			MCP_OAUTH_ENABLED: 'true',
			MCP_OAUTH_DCR_ENABLED: 'true',
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

async function withMcpOAuthDisabled(run: () => Promise<void>) {
	await patchSettings({ mcp_oauth_enabled: false }, apiUrl);

	try {
		await run();
	} finally {
		await patchSettings({ mcp_oauth_enabled: true }, apiUrl);
	}
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
});
