import crypto from 'node:crypto';
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

type JsonValue = Record<string, unknown> | unknown[];

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
	opts: { redirectUri?: string; grantTypes?: string[]; apiUrl?: string } = {},
): Promise<string> {
	const apiUrl = opts.apiUrl ?? baseUrl;
	const redirectUri = opts.redirectUri ?? `${apiUrl}/mcp-oauth-test-callback`;
	const grantTypes = opts.grantTypes ?? ['authorization_code', 'refresh_token'];

	const response = await postJson(
		'/mcp-oauth/register',
		{
			client_name: `test-client-${crypto.randomUUID()}`,
			redirect_uris: [redirectUri],
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

export async function authorizePublicClient(args: {
	clientId: string;
	redirectUri: string;
	pkce: Pkce;
	cookies: string;
	apiUrl?: string;
}): Promise<string> {
	const apiUrl = args.apiUrl ?? baseUrl;
	const authorizeUrl = new URL(`${apiUrl}/mcp-oauth/authorize`);

	authorizeUrl.searchParams.set('client_id', args.clientId);
	authorizeUrl.searchParams.set('redirect_uri', args.redirectUri);
	authorizeUrl.searchParams.set('response_type', 'code');
	authorizeUrl.searchParams.set('code_challenge', args.pkce.challenge);
	authorizeUrl.searchParams.set('code_challenge_method', 'S256');
	authorizeUrl.searchParams.set('scope', 'mcp:access');
	authorizeUrl.searchParams.set('resource', getResourceUrl(apiUrl));

	const consentResponse = await fetch(authorizeUrl, {
		headers: {
			Cookie: args.cookies,
		},
	});

	const consentHtml = await expectTextResponse(consentResponse, 200);
	const signed_params = extractSignedParams(consentHtml);

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

	return extractCodeFromLocation(location);
}

export async function exchangeCode(args: {
	clientId: string;
	code: string;
	redirectUri: string;
	codeVerifier: string;
	apiUrl?: string;
}): Promise<OAuthTokens> {
	const apiUrl = args.apiUrl ?? baseUrl;

	const response = await postForm(
		'/mcp-oauth/token',
		{
			grant_type: 'authorization_code',
			client_id: args.clientId,
			code: args.code,
			redirect_uri: args.redirectUri,
			code_verifier: args.codeVerifier,
			resource: getResourceUrl(apiUrl),
		},
		undefined,
		apiUrl,
	);

	return (await expectJsonResponse(response, 200)) as OAuthTokens;
}

export async function refreshToken(args: {
	clientId: string;
	refreshToken: string;
	apiUrl?: string;
}): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;

	return postForm(
		'/mcp-oauth/token',
		{
			grant_type: 'refresh_token',
			client_id: args.clientId,
			refresh_token: args.refreshToken,
			resource: getResourceUrl(apiUrl),
		},
		undefined,
		apiUrl,
	);
}

export async function revokeToken(args: { clientId: string; token: string; apiUrl?: string }): Promise<Response> {
	const apiUrl = args.apiUrl ?? baseUrl;

	return postForm(
		'/mcp-oauth/revoke',
		{
			client_id: args.clientId,
			token: args.token,
		},
		undefined,
		apiUrl,
	);
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
