import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import {
	baseUrl,
	CimdMetadataServer,
	enableMcpOAuthSettings,
	expectJsonResponse,
	expectTextResponse,
	generatePKCE,
	getResourceUrl,
	loginAsAdminSession,
} from './mcp-oauth-utils.js';

const redirectUri = 'http://127.0.0.1:9876/callback';
const metadataServers: CimdMetadataServer[] = [];

/*
 * The hardened CIMD egress policy rejects loopback and other RFC 6890 special-use
 * DNS answers before fetching metadata. That makes a local positive CIMD fetch
 * unsuitable for e2e: localhost, Docker bridge addresses, host.docker.internal,
 * and hosts-file aliases should all be blocked. A positive non-loopback e2e
 * would need public DNS plus public routing back to the test metadata server, or
 * privileged local DNS/routing setup. Keep that behavior in unit/service tests,
 * and use e2e here for the public authorize-path rejection that is practical to
 * observe without external infrastructure.
 */
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

describe('/mcp-oauth CIMD egress hardening', () => {
	test('rejects first-contact CIMD metadata URLs that resolve to loopback before requesting the document', async () => {
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

		const text = await expectTextResponse(response, 400);

		expect(text).toContain('Failed to fetch client metadata document');
		expect(metadataServer.getRequestCount()).toBe(0);
	});
});

describe('/mcp-oauth CIMD metadata advertising', () => {
	test('authorization server metadata advertises CIMD support when enabled', async () => {
		const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
		const body = (await expectJsonResponse(response, 200)) as { client_id_metadata_document_supported?: boolean };

		expect(body.client_id_metadata_document_supported).toBe(true);
	});
});
