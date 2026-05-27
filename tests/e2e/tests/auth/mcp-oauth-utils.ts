import crypto from 'node:crypto';
import http from 'node:http';
import { port } from '@utils/constants.js';

export const baseUrl = `http://127.0.0.1:${port}`;
export const adminToken = 'admin';
export const adminEmail = 'admin@example.com';
export const adminPassword = 'pw';

export type Pkce = {
	verifier: string;
	challenge: string;
};

export type OAuthTokens = {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
};

export type ConfidentialAuthMethod = 'client_secret_basic' | 'client_secret_post';

export type RegisteredConfidentialClient = {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	tokenEndpointAuthMethod: ConfidentialAuthMethod;
};

export type CimdMetadataServerOptions = {
	path?: string;
};

type JsonValue = Record<string, unknown> | unknown[];

export class CimdMetadataServer {
	private server: http.Server | undefined;
	private port = 0;
	private metadata: Record<string, unknown> = {};
	private requestCount = 0;
	private etag: string | null = null;
	private readonly servePath: string;

	constructor(opts: CimdMetadataServerOptions = {}) {
		this.servePath = opts.path ?? `/metadata-${crypto.randomUUID()}.json`;
	}

	async start(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				if (req.url !== this.servePath) {
					res.writeHead(404);
					res.end();
					return;
				}

				this.requestCount++;

				if (this.etag && req.headers['if-none-match'] === this.etag) {
					res.writeHead(304, { ETag: this.etag });
					res.end();
					return;
				}

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
					'Cache-Control': 'max-age=3600',
				};

				if (this.etag) headers['ETag'] = this.etag;

				res.writeHead(200, headers);
				res.end(JSON.stringify(this.metadata));
			});

			this.server.listen(0, 'localhost', () => {
				const address = this.server?.address();

				if (!address || typeof address === 'string') {
					reject(new Error('CIMD metadata server did not expose a TCP port'));
					return;
				}

				this.port = address.port;
				resolve();
			});

			this.server.on('error', reject);
		});
	}

	async stop(): Promise<void> {
		const server = this.server;

		if (!server) return;

		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) reject(error);
				else resolve();
			});
		});

		this.server = undefined;
		this.port = 0;
	}

	getUrl(): string {
		if (this.port === 0) throw new Error('CIMD metadata server has not started');

		return `http://localhost:${this.port}`;
	}

	getClientId(): string {
		return `${this.getUrl()}${this.servePath}`;
	}

	getRequestCount(): number {
		return this.requestCount;
	}

	resetRequestCount(): void {
		this.requestCount = 0;
	}

	setMetadata(doc: Record<string, unknown>): void {
		this.metadata = doc;
	}

	setEtag(etag: string | null): void {
		this.etag = etag;
	}

	setDefaultMetadata(overrides: Record<string, unknown> = {}): void {
		this.metadata = {
			client_id: this.getClientId(),
			client_name: 'Test CIMD Client',
			redirect_uris: ['http://127.0.0.1:9876/callback'],
			grant_types: ['authorization_code', 'refresh_token'],
			token_endpoint_auth_method: 'none',
			...overrides,
		};
	}
}

export function generatePKCE(): Pkce {
	const verifier = crypto.randomBytes(32).toString('hex');
	const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

	return { verifier, challenge };
}

export function extractCodeFromLocation(location: string): string {
	const url = new URL(location);
	const code = url.searchParams.get('code');

	if (!code) throw new Error(`No code in location: ${location}`);

	return code;
}

export function extractSignedParams(html: string): string {
	const match = html.match(/name="signed_params"\s+value="([^"]+)"/);

	if (!match?.[1]) throw new Error('signed_params not found in consent page HTML');

	return match[1];
}

export async function expectJsonResponse(response: Response, status: number): Promise<JsonValue> {
	const text = await response.text();
	let body: JsonValue;

	try {
		body = JSON.parse(text) as JsonValue;
	} catch {
		throw new Error(`Expected JSON response ${status}, got ${response.status}: ${text}`);
	}

	if (response.status !== status) {
		throw new Error(`Expected JSON response ${status}, got ${response.status}: ${text}`);
	}

	return body;
}

export async function expectTextResponse(response: Response, status: number): Promise<string> {
	const text = await response.text();

	if (response.status !== status) {
		throw new Error(`Expected text response ${status}, got ${response.status}: ${text}`);
	}

	return text;
}

export function getSetCookies(headers: Headers): string[] {
	const maybeHeaders = headers as Headers & { getSetCookie?: () => string[] };
	const cookies = maybeHeaders.getSetCookie?.();

	if (cookies?.length) return cookies;

	const cookie = headers.get('set-cookie');
	return cookie ? [cookie] : [];
}

export function toCookieHeader(setCookies: string[]): string {
	return setCookies.map((cookie) => cookie.split(';')[0]).join('; ');
}

export function getResourceUrl(apiUrl = baseUrl): string {
	return `${apiUrl}/mcp`;
}

export async function postJson(
	path: string,
	body: unknown,
	init: RequestInit = {},
	apiUrl = baseUrl,
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'application/json');

	return fetch(`${apiUrl}${path}`, {
		...init,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});
}

export async function postForm(
	path: string,
	body: Record<string, string>,
	init: RequestInit = {},
	apiUrl = baseUrl,
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'application/x-www-form-urlencoded');

	return fetch(`${apiUrl}${path}`, {
		...init,
		method: 'POST',
		headers,
		body: new URLSearchParams(body),
	});
}

export async function patchSettings(settings: Record<string, unknown>, apiUrl = baseUrl): Promise<void> {
	const response = await fetch(`${apiUrl}/settings`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${adminToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(settings),
	});

	await expectJsonResponse(response, 200);
}

export async function enableMcpOAuthSettings(apiUrl = baseUrl): Promise<void> {
	await patchSettings(
		{
			mcp_enabled: true,
			mcp_oauth_enabled: true,
			mcp_oauth_dcr_enabled: true,
			mcp_oauth_cimd_enabled: true,
		},
		apiUrl,
	);
}

export async function loginAsAdminSession(apiUrl = baseUrl): Promise<string> {
	const response = await postJson(
		'/auth/login',
		{
			email: adminEmail,
			password: adminPassword,
			mode: 'session',
		},
		undefined,
		apiUrl,
	);

	await expectJsonResponse(response, 200);

	const setCookies = getSetCookies(response.headers);

	if (setCookies.length === 0) throw new Error('No Set-Cookie header in login response');

	return toCookieHeader(setCookies);
}

export async function loginAsAdminToken(apiUrl = baseUrl): Promise<string> {
	const response = await postJson(
		'/auth/login',
		{
			email: adminEmail,
			password: adminPassword,
		},
		undefined,
		apiUrl,
	);

	const body = (await expectJsonResponse(response, 200)) as { data?: { access_token?: string } };
	const accessToken = body.data?.access_token;

	if (!accessToken) throw new Error(`No access_token in login response: ${JSON.stringify(body)}`);

	return accessToken;
}

export async function registerPublicClient(
	opts: { redirectUri?: string; redirectUris?: string[]; grantTypes?: string[]; apiUrl?: string } = {},
): Promise<string> {
	const apiUrl = opts.apiUrl ?? baseUrl;
	const redirectUri = opts.redirectUri ?? `${apiUrl}/mcp-oauth-test-callback`;
	const redirectUris = opts.redirectUris ?? [redirectUri];
	const grantTypes = opts.grantTypes ?? ['authorization_code', 'refresh_token'];

	const response = await postJson(
		'/mcp-oauth/register',
		{
			client_name: `test-client-${crypto.randomUUID()}`,
			redirect_uris: redirectUris,
			grant_types: grantTypes,
			token_endpoint_auth_method: 'none',
		},
		undefined,
		apiUrl,
	);

	const body = (await expectJsonResponse(response, 201)) as { client_id?: string };

	if (!body.client_id) throw new Error(`No client_id in registration response: ${JSON.stringify(body)}`);

	return body.client_id;
}

export async function registerConfidentialClient(
	opts: {
		redirectUri?: string;
		grantTypes?: string[];
		tokenEndpointAuthMethod?: ConfidentialAuthMethod;
		apiUrl?: string;
	} = {},
): Promise<RegisteredConfidentialClient> {
	const apiUrl = opts.apiUrl ?? baseUrl;
	const redirectUri = opts.redirectUri ?? `${apiUrl}/mcp-oauth-test-callback`;
	const grantTypes = opts.grantTypes ?? ['authorization_code', 'refresh_token'];
	const tokenEndpointAuthMethod = opts.tokenEndpointAuthMethod ?? 'client_secret_basic';

	const response = await postJson(
		'/mcp-oauth/register',
		{
			client_name: `test-confidential-client-${crypto.randomUUID()}`,
			redirect_uris: [redirectUri],
			grant_types: grantTypes,
			token_endpoint_auth_method: tokenEndpointAuthMethod,
		},
		undefined,
		apiUrl,
	);

	const body = (await expectJsonResponse(response, 201)) as {
		client_id?: string;
		client_secret?: string;
		token_endpoint_auth_method?: ConfidentialAuthMethod;
	};

	if (!body.client_id || !body.client_secret) {
		throw new Error(`No confidential client credentials in registration response: ${JSON.stringify(body)}`);
	}

	return {
		clientId: body.client_id,
		clientSecret: body.client_secret,
		redirectUri,
		tokenEndpointAuthMethod: body.token_endpoint_auth_method ?? tokenEndpointAuthMethod,
	};
}

function formEncode(value: string): string {
	return encodeURIComponent(value).replace(/%20/g, '+');
}

export function basicClientAuthHeader(clientId: string, clientSecret: string): string {
	return `Basic ${Buffer.from(`${formEncode(clientId)}:${formEncode(clientSecret)}`).toString('base64')}`;
}

export async function authorizePublicClient(args: {
	clientId: string;
	redirectUri: string;
	pkce: Pkce;
	cookies: string;
	apiUrl?: string;
}): Promise<string> {
	const consentResponse = await fetchPublicClientConsentPage(args);
	const consentHtml = await expectTextResponse(consentResponse, 200);
	const signed_params = extractSignedParams(consentHtml);

	const decisionResponse = await approvePublicClientConsent({ ...args, signedParams: signed_params });

	if (decisionResponse.status !== 302) {
		throw new Error(
			`Expected authorize decision redirect, got ${decisionResponse.status}: ${await decisionResponse.text()}`,
		);
	}

	const location = decisionResponse.headers.get('location');

	if (!location) throw new Error('No Location header in authorize decision response');

	return extractCodeFromLocation(location);
}

export async function fetchPublicClientConsentPage(args: {
	clientId: string;
	redirectUri: string;
	pkce: Pkce;
	cookies: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const authorizeUrl = new URL(`${apiUrl}/mcp-oauth/authorize`);

	authorizeUrl.searchParams.set('client_id', args.clientId);
	authorizeUrl.searchParams.set('redirect_uri', args.redirectUri);
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('code_challenge', args.pkce.challenge);
	authorizeUrl.searchParams.set('code_challenge_method', 'S256');
	authorizeUrl.searchParams.set('scope', 'mcp:access');
	authorizeUrl.searchParams.set('resource', getResourceUrl(apiUrl));

	return fetch(authorizeUrl, {
		headers: {
			Cookie: args.cookies,
		},
	});
}

export async function approvePublicClientConsent(args: {
	signedParams: string;
	cookies: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;

	return postForm(
		'/mcp-oauth/authorize/decision',
		{ signed_params: args.signedParams, approved: 'true' },
		{
			redirect: 'manual',
			headers: {
				Cookie: args.cookies,
				Origin: apiUrl,
			},
		},
		apiUrl,
	);
}

export async function exchangeCode(args: {
	clientId: string;
	code: string;
	redirectUri: string;
	codeVerifier: string;
	clientSecret?: string;
	authorizationHeader?: string;
	apiUrl?: string;
}): Promise<OAuthTokens> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const headers = args.authorizationHeader ? { Authorization: args.authorizationHeader } : undefined;

	const body: Record<string, string> = {
		grant_type: 'authorization_code',
		client_id: args.clientId,
		code: args.code,
		redirect_uri: args.redirectUri,
		code_verifier: args.codeVerifier,
		resource: getResourceUrl(apiUrl),
	};

	if (args.clientSecret) body['client_secret'] = args.clientSecret;

	const response = await postForm('/mcp-oauth/token', body, headers ? { headers } : undefined, apiUrl);

	return (await expectJsonResponse(response, 200)) as OAuthTokens;
}

export async function refreshToken(args: {
	clientId: string;
	refreshToken: string;
	clientSecret?: string;
	authorizationHeader?: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const headers = args.authorizationHeader ? { Authorization: args.authorizationHeader } : undefined;

	const body: Record<string, string> = {
		grant_type: 'refresh_token',
		client_id: args.clientId,
		refresh_token: args.refreshToken,
		resource: getResourceUrl(apiUrl),
	};

	if (args.clientSecret) body['client_secret'] = args.clientSecret;

	return postForm('/mcp-oauth/token', body, headers ? { headers } : undefined, apiUrl);
}

export async function revokeToken(args: {
	clientId: string;
	token: string;
	clientSecret?: string;
	authorizationHeader?: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const headers = args.authorizationHeader ? { Authorization: args.authorizationHeader } : undefined;

	const body: Record<string, string> = {
		client_id: args.clientId,
		token: args.token,
	};

	if (args.clientSecret) body['client_secret'] = args.clientSecret;

	return postForm('/mcp-oauth/revoke', body, headers ? { headers } : undefined, apiUrl);
}

export async function postMcpToolsList(accessToken: string, apiUrl = baseUrl): Promise<Response> {
	return postJson(
		'/mcp',
		{
			jsonrpc: '2.0',
			method: 'tools/list',
			id: 1,
		},
		{
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
		},
		apiUrl,
	);
}

export async function postMcpToolsListWithQueryToken(accessToken: string, apiUrl = baseUrl): Promise<Response> {
	return postJson(
		`/mcp?access_token=${encodeURIComponent(accessToken)}`,
		{
			jsonrpc: '2.0',
			method: 'tools/list',
			id: 1,
		},
		{
			headers: {
				Accept: 'application/json',
			},
		},
		apiUrl,
	);
}

export async function createNonAdminToken(apiUrl = baseUrl): Promise<string> {
	const token = crypto.randomUUID();
	const email = `mcp-oauth-non-admin-${crypto.randomUUID()}@example.com`;

	const response = await postJson(
		'/users',
		{
			email,
			password: crypto.randomUUID(),
			token,
		},
		{
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		},
		apiUrl,
	);

	await expectJsonResponse(response, 200);

	return token;
}

export function openWebSocket(apiUrl = baseUrl): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		const wsUrl = apiUrl.replace(/^http/, 'ws');
		const socket = new WebSocket(`${wsUrl}/websocket`);

		socket.addEventListener('open', () => resolve(socket), { once: true });
		socket.addEventListener('error', reject, { once: true });
	});
}

export async function createOAuthTokens(apiUrl = baseUrl): Promise<{
	clientId: string;
	redirectUri: string;
	pkce: Pkce;
	tokens: OAuthTokens;
}> {
	const redirectUri = `${apiUrl}/mcp-oauth-test-callback-${crypto.randomUUID()}`;
	const clientId = await registerPublicClient({ redirectUri, apiUrl });
	const cookies = await loginAsAdminSession(apiUrl);
	const pkce = generatePKCE();
	const code = await authorizePublicClient({ clientId, redirectUri, pkce, cookies, apiUrl });
	const tokens = await exchangeCode({ clientId, code, redirectUri, codeVerifier: pkce.verifier, apiUrl });

	return { clientId, redirectUri, pkce, tokens };
}
