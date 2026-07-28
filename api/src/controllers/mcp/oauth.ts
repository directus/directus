import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { NextFunction, Request, Response } from 'express';
import express, { Router } from 'express';
import { getMcpUrls } from '../../ai/mcp/utils.js';
import getDatabase from '../../database/index.js';
import { useLogger } from '../../logger/index.js';
import { createRateLimiter, RateLimiterRes } from '../../rate-limiter.js';
import { McpOAuthService, OAuthError } from '../../services/mcp-oauth/index.js';
import { getAllowedCustomRedirectSchemes } from '../../services/mcp-oauth/utils/redirect.js';
import { summarizeDcrRegistrationMetadata } from '../../services/mcp-oauth/utils/registration-debug.js';
import { SettingsService } from '../../services/settings.js';
import asyncHandler from '../../utils/async-handler.js';
import { getAccountabilityForToken } from '../../utils/get-accountability-for-token.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getSchema } from '../../utils/get-schema.js';
import { Url } from '../../utils/url.js';
import {
	type ConsentPageData,
	type PageOpts,
	type RedirectIndicator,
	type RegistrationType,
	renderConsentPage,
	renderErrorPage,
} from './oauth-consent-page.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getRedirectIndicator(
	redirectUri: string,
	clientId: string,
	registrationType: RegistrationType,
): RedirectIndicator | undefined {
	try {
		const redirectUrl = new URL(redirectUri);
		const host = redirectUrl.hostname;

		// Localhost check
		if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
			return 'localhost';
		}

		// Bare IP (non-loopback)
		if (isIP(host) !== 0) {
			return 'ip-address';
		}

		// Cross-origin check (CIMD only)
		if (registrationType === 'cimd') {
			try {
				const clientUrl = new URL(clientId);

				if (redirectUrl.hostname !== clientUrl.hostname) {
					return 'cross-origin';
				}
			} catch {
				/* not a URL client_id, skip */
			}
		}
	} catch {
		/* invalid redirect URI, skip */
	}

	return undefined;
}

// ---------------------------------------------------------------------------
// Shared middleware
// ---------------------------------------------------------------------------

/**
 * RFC 6749 Section 3.1: reject requests with duplicate form parameters.
 * Express parses duplicates as arrays, so any array value indicates a duplicate.
 */
function rejectDuplicateParams(req: Request, res: Response, next: NextFunction) {
	for (const [key, value] of Object.entries(req.body)) {
		if (Array.isArray(value)) {
			res.status(400).json({ error: 'invalid_request', error_description: `Duplicate parameter: ${key}` });
			return;
		}
	}

	next();
}

/**
 * Consent endpoints are browser-based (rendered HTML form), so the session must
 * come from a cookie. Rejects bearer-token auth to prevent token-stealing attacks
 * where a malicious client tricks the user into submitting consent via API.
 */
function requireCookieAuth(req: Request, res: Response, next: NextFunction) {
	if (req.tokenSource !== 'cookie') {
		res.status(403).json({ error: 'access_denied', error_description: 'Cookie authentication required' });
		return;
	}

	next();
}

/**
 * CSRF protection via Origin header. Only allows requests from the same origin
 * as PUBLIC_URL. This guards the consent decision endpoint -- without it, a
 * malicious page could POST approval on behalf of an authenticated user.
 */
function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
	const env = useEnv();
	const origin = req.headers['origin'];

	if (!origin) {
		res.status(403).json({ error: 'access_denied', error_description: 'Origin header required' });
		return;
	}

	let publicUrl: URL;
	let requestOrigin: URL;

	try {
		publicUrl = new URL(String(env['PUBLIC_URL']));
		requestOrigin = new URL(origin);
	} catch {
		res.status(403).json({ error: 'access_denied', error_description: 'Malformed Origin header' });
		return;
	}

	if (publicUrl.origin !== requestOrigin.origin) {
		res.status(403).json({ error: 'access_denied', error_description: 'Cross-origin request not allowed' });
		return;
	}

	next();
}

/**
 * Override Helmet's CSP form-action directive on this response only.
 * The consent page form POSTs to 'self', but the 302 redirect targets external
 * callback URIs. Chrome extends form-action to the redirect chain.
 * Redirect URIs are validated at DCR/CIMD time (HTTPS, localhost, or known MCP desktop redirects only).
 */
function relaxFormAction(res: Response) {
	const csp = res.getHeader('Content-Security-Policy');

	if (typeof csp === 'string') {
		const customSchemes = getAllowedCustomRedirectSchemes();
		const customSchemeSources = customSchemes.length > 0 ? ` ${customSchemes.join(' ')}` : '';

		res.set(
			'Content-Security-Policy',
			csp.replace(
				/form-action\s+([^;]+)/,
				`form-action $1 https: http://localhost:* http://127.0.0.1:*${customSchemeSources}`,
			),
		);
	}
}

/**
 * Convert OAuthError to RFC 6749/7591 JSON error format (`{ error, error_description }`).
 * Non-OAuthError instances fall through to the default Directus error handler.
 */
function oauthErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
	if (err instanceof OAuthError) {
		for (const [key, value] of Object.entries(err.headers)) {
			res.set(key, value);
		}

		res.status(err.status).json({
			error: err.code,
			error_description: err.description,
		});

		return;
	}

	next(err);
}

function setCorsWildcard(_req: Request, res: Response, next: NextFunction) {
	res.set('Access-Control-Allow-Origin', '*');
	next();
}

function noCache(res: Response) {
	res.set('Cache-Control', 'no-store');
	res.set('Pragma', 'no-cache');
}

function setNoCacheHeaders(_req: Request, res: Response, next: NextFunction) {
	noCache(res);
	next();
}

function getRegistrationRequestDebugContext(req: Request) {
	return {
		content_type: req.headers['content-type'],
		user_agent: req.headers['user-agent'],
		registration: summarizeDcrRegistrationMetadata(req.body),
	};
}

function logRegistrationBodyParseError(err: unknown, req: Request, _res: Response, next: NextFunction) {
	useLogger().debug(
		{
			reason: 'invalid_json',
			content_type: req.headers['content-type'],
			error: err instanceof Error ? err.message : undefined,
		},
		'MCP OAuth DCR request body parsing failed',
	);

	next(err);
}

function isOAuthHtmlEndpoint(req: Request) {
	return req.path === '/mcp-oauth/authorize' || req.path === '/mcp-oauth/authorize/decision';
}

async function loadOAuthPageOpts(
	req: Request,
	settingsService: SettingsService,
	authenticatedUserId = req.accountability?.user,
): Promise<PageOpts> {
	const env = useEnv();

	const [settings, user] = await Promise.all([
		settingsService.readSingleton({
			fields: ['project_name', 'project_color', 'project_logo', 'default_appearance'],
		}),
		authenticatedUserId
			? getDatabase()('directus_users').where('id', authenticatedUserId).select('appearance').first()
			: null,
	]);

	const projectLogo = settings?.project_logo;

	return {
		projectName: settings?.project_name ?? 'Directus',
		projectColor: settings?.project_color ?? '#6644ff',
		logoUrl: projectLogo ? new Url(env['PUBLIC_URL'] as string).addPath('assets', projectLogo).toString() : null,
		appearance: (user?.appearance ?? settings?.default_appearance ?? 'auto') as string,
	};
}

/**
 * Middleware: check mcp_enabled + mcp_oauth_enabled settings.
 * Env vars (MCP_ENABLED, MCP_OAUTH_ENABLED) are already gated at the app.ts mount level.
 */
async function checkOAuthSettings(req: Request, res: Response, next: NextFunction) {
	const settingsService = new SettingsService({ schema: req.schema ?? (await getSchema()) });

	const settings = await settingsService.readSingleton({ fields: ['mcp_enabled', 'mcp_oauth_enabled'] });

	if (toBoolean(settings?.mcp_enabled) !== true || toBoolean(settings?.mcp_oauth_enabled) !== true) {
		// For browser endpoints (authorize), render error page
		if (isOAuthHtmlEndpoint(req)) {
			const pageOpts = await loadOAuthPageOpts(req, settingsService);

			res.set('Content-Type', 'text/html; charset=utf-8');
			res.status(403).send(await renderErrorPage('MCP OAuth is disabled in project settings.', pageOpts));
			return;
		}

		// For API endpoints (register, token, revoke), return JSON error
		res.set('Access-Control-Allow-Origin', '*');
		if (req.path.includes('/token')) noCache(res);

		res.status(403).json({
			error: 'mcp_oauth_disabled',
			error_description: 'MCP OAuth is disabled in project settings.',
		});

		return;
	}

	next();
}

// ---------------------------------------------------------------------------
// Rate limiters (lazy init to avoid env access at import time)
// ---------------------------------------------------------------------------

type McpOAuthRateLimitPrefix = 'RATE_LIMITER_MCP_OAUTH' | 'RATE_LIMITER_MCP_OAUTH_REGISTRATION';

function createRateLimitMiddleware(
	prefix: McpOAuthRateLimitPrefix,
): (req: Request, res: Response, next: NextFunction) => void {
	const env = useEnv();
	const enabledKey = `${prefix}_ENABLED` as const;

	if (env[enabledKey] !== true) {
		return (_req, _res, next) => next();
	}

	const limiter = createRateLimiter(prefix);

	return (req: Request, res: Response, next: NextFunction) => {
		limiter
			.consume(getIPFromReq(req) ?? '0.0.0.0')
			.then(() => next())
			.catch((rlRes: unknown) => {
				if (rlRes instanceof RateLimiterRes) {
					res.set('Retry-After', String(Math.ceil(rlRes.msBeforeNext / 1000)));
					res.status(429).json({ error: 'rate_limit_exceeded', error_description: 'Too many requests' });
				} else {
					next(rlRes);
				}
			});
	};
}

const oauthRateLimitMiddleware = createRateLimitMiddleware('RATE_LIMITER_MCP_OAUTH');
const registrationRateLimitMiddleware = createRateLimitMiddleware('RATE_LIMITER_MCP_OAUTH_REGISTRATION');

// ---------------------------------------------------------------------------
// Public router (mounted BEFORE authenticate in app.ts)
// ---------------------------------------------------------------------------

/**
 * Unauthenticated OAuth routes. Mounted before the authenticate middleware in app.ts.
 *
 * Routes: `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server`
 * (RFC 9728/8414 discovery), `/mcp-oauth/authorize` (consent page with manual session check),
 * `/mcp-oauth/register` (DCR), `/mcp-oauth/token`, `/mcp-oauth/revoke`.
 */
export const mcpOAuthPublicRouter = Router();

// Discovery: .well-known/oauth-protected-resource (with and without RFC 9728 path insertion)
mcpOAuthPublicRouter.get(
	'/.well-known/oauth-protected-resource*',
	setCorsWildcard,
	asyncHandler(checkOAuthSettings),
	asyncHandler(async (_req: Request, res: Response) => {
		const service = new McpOAuthService({ schema: await getSchema() });
		res.json(service.getProtectedResourceMetadata());
	}),
);

// Discovery: .well-known/oauth-authorization-server (with and without RFC 8414 path insertion)
mcpOAuthPublicRouter.get(
	'/.well-known/oauth-authorization-server*',
	setCorsWildcard,
	asyncHandler(checkOAuthSettings),
	asyncHandler(async (_req: Request, res: Response) => {
		const service = new McpOAuthService({ schema: await getSchema() });
		res.json(await service.getAuthorizationServerMetadata());
	}),
);

// Authorize: GET /mcp-oauth/authorize - standalone consent page (no SPA dependency)
mcpOAuthPublicRouter.get(
	'/mcp-oauth/authorize',
	oauthRateLimitMiddleware,
	asyncHandler(checkOAuthSettings),
	asyncHandler(async (req: Request, res: Response) => {
		const env = useEnv();
		const loginUrl = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'login').toString();
		const schema = await getSchema();

		function redirectToLogin() {
			res.redirect(302, `${loginUrl}?redirect=${encodeURIComponent(req.originalUrl)}`);
		}

		// Check session cookie manually (this route is before authenticate middleware)
		const cookieName = env['SESSION_COOKIE_NAME'] as string;
		const sessionToken = req.cookies?.[cookieName];

		if (!sessionToken) {
			redirectToLogin();
			return;
		}

		// Verify session and get accountability
		let accountability;

		try {
			accountability = await getAccountabilityForToken(sessionToken, { schema });
		} catch {
			redirectToLogin();
			return;
		}

		if (!accountability?.user || accountability.oauth) {
			redirectToLogin();
			return;
		}

		// Load project settings and user appearance
		const settingsService = new SettingsService({ schema });
		const pageOpts = await loadOAuthPageOpts(req, settingsService, accountability.user);

		// Validate OAuth params and get signed consent JWT
		const service = new McpOAuthService({ schema });
		const sessionHash = createHash('sha256').update(sessionToken).digest('hex');

		try {
			const result = await service.validateAuthorization(
				{
					client_id: req.query['client_id'] as string,
					redirect_uri: req.query['redirect_uri'] as string,
					response_type: req.query['response_type'] as string,
					code_challenge: req.query['code_challenge'] as string,
					code_challenge_method: req.query['code_challenge_method'] as string,
					scope: req.query['scope'] as string,
					resource: req.query['resource'] as string,
					state: req.query['state'] as string | undefined,
					response_mode: req.query['response_mode'] as string,
				},
				accountability.user,
				sessionHash,
			);

			const decisionUrl = new Url(env['PUBLIC_URL'] as string).addPath('mcp-oauth', 'authorize', 'decision').toString();

			res.set('Content-Type', 'text/html; charset=utf-8');
			noCache(res);
			relaxFormAction(res);

			const clientId = req.query['client_id'] as string;
			const registrationType: RegistrationType = result.registration_type ?? 'dcr';

			const consentData: ConsentPageData = {
				clientName: result.client_name,
				redirectUri: result.redirect_uri,
				scope: result.scope,
				signedParams: result.signed_params,
				decisionUrl,
				clientDomain: result.client_domain,
				registrationType,
				redirectIndicator: getRedirectIndicator(result.redirect_uri, clientId, registrationType),
			};

			res.send(await renderConsentPage(consentData, pageOpts));
		} catch (err) {
			if (!(err instanceof OAuthError)) {
				throw err;
			}

			if (err.redirectable) {
				// Trusted redirect URI -- redirect with error per RFC 6749 Section 4.1.2.1
				const redirectUri = req.query['redirect_uri'] as string;
				const state = req.query['state'] as string | undefined;
				const { issuerUrl } = getMcpUrls();

				const url = new URL(redirectUri);
				url.searchParams.set('error', err.code);
				url.searchParams.set('error_description', err.description);
				if (state) url.searchParams.set('state', state);
				url.searchParams.set('iss', issuerUrl);
				res.redirect(302, url.toString());
				return;
			}

			// Pre-trust error or unknown -- render local error page
			res.set('Content-Type', 'text/html; charset=utf-8');
			noCache(res);
			res.status(err.status).send(await renderErrorPage(err.description, pageOpts));
		}
	}),
);

// DCR: POST /mcp-oauth/register
mcpOAuthPublicRouter.post(
	'/mcp-oauth/register',
	registrationRateLimitMiddleware,
	asyncHandler(checkOAuthSettings),
	express.json(),
	logRegistrationBodyParseError,
	setCorsWildcard,
	asyncHandler(async (req: Request, res: Response) => {
		const logger = useLogger();
		const schema = await getSchema();
		const service = new McpOAuthService({ schema });
		const debugContext = getRegistrationRequestDebugContext(req);
		let result;

		try {
			result = await service.registerClient(req.body);
		} catch (err) {
			if (err instanceof OAuthError) {
				logger.debug(
					{
						...debugContext,
						status: err.status,
						code: err.code,
						description: err.description,
					},
					'MCP OAuth DCR request rejected',
				);
			} else {
				logger.debug(
					{
						...debugContext,
						error: err instanceof Error ? { name: err.name, message: err.message } : undefined,
					},
					'MCP OAuth DCR request failed',
				);
			}

			throw err;
		}

		logger.debug(
			{
				client_id: result.client_id,
				token_endpoint_auth_method: result.token_endpoint_auth_method,
				redirect_uri_count: result.redirect_uris.length,
				grant_types: result.grant_types,
			},
			'MCP OAuth DCR client registered',
		);

		res.set('Cache-Control', 'no-store');
		res.status(201).json(result);
	}),
);

// Token: POST /mcp-oauth/token
mcpOAuthPublicRouter.post(
	'/mcp-oauth/token',
	oauthRateLimitMiddleware,
	asyncHandler(checkOAuthSettings),
	express.urlencoded({ extended: false }),
	rejectDuplicateParams,
	setCorsWildcard,
	setNoCacheHeaders,
	asyncHandler(async (req: Request, res: Response) => {
		const schema = await getSchema();
		const service = new McpOAuthService({ schema });

		const context = {
			ip: getIPFromReq(req) ?? '0.0.0.0',
			userAgent: req.headers['user-agent'] ?? 'unknown',
		};

		const grantType = req.body.grant_type;
		let result;

		const authParams = { ...req.body, authorization_header: req.headers.authorization };

		if (grantType === 'authorization_code') {
			result = await service.exchangeCode(authParams, context);
		} else if (grantType === 'refresh_token') {
			result = await service.refreshToken(authParams, context);
		} else if (!grantType) {
			throw new OAuthError(400, 'invalid_request', 'grant_type is required');
		} else {
			throw new OAuthError(400, 'unsupported_grant_type', `Unsupported grant_type: ${grantType}`);
		}

		res.json(result);
	}),
);

// Revoke: POST /mcp-oauth/revoke
mcpOAuthPublicRouter.post(
	'/mcp-oauth/revoke',
	oauthRateLimitMiddleware,
	asyncHandler(checkOAuthSettings),
	express.urlencoded({ extended: false }),
	rejectDuplicateParams,
	setCorsWildcard,
	asyncHandler(async (req: Request, res: Response) => {
		const schema = await getSchema();
		const service = new McpOAuthService({ schema });
		await service.revokeToken({ ...req.body, authorization_header: req.headers.authorization });
		res.status(200).json({});
	}),
);

mcpOAuthPublicRouter.use(oauthErrorHandler);

// ---------------------------------------------------------------------------
// Protected router (mounted AFTER authenticate in app.ts)
// ---------------------------------------------------------------------------

/**
 * Authenticated OAuth routes. Mounted after the authenticate middleware in app.ts.
 * Requires cookie-based auth + same-origin checks (consent is a browser interaction).
 *
 * Routes: `/mcp-oauth/authorize/decision` (native form POST with 302 redirect).
 */
export const mcpOAuthProtectedRouter = Router();

// Decision: POST /mcp-oauth/authorize/decision
// Native form POST + 302 redirect. Auth code stays in HTTP layer, never enters JS.
// Consent page CSP form-action allows https:, localhost, and known MCP desktop redirect targets.
mcpOAuthProtectedRouter.post(
	'/mcp-oauth/authorize/decision',
	asyncHandler(checkOAuthSettings),
	express.urlencoded({ extended: false }),
	rejectDuplicateParams,
	requireCookieAuth,
	requireSameOrigin,
	asyncHandler(async (req: Request, res: Response) => {
		const service = new McpOAuthService({ schema: req.schema });
		const redirectUrl = await service.processDecision(req.body, req.accountability!.user!, req.token!);
		res.set('Referrer-Policy', 'no-referrer');
		noCache(res);
		res.redirect(302, redirectUrl);
	}),
);

mcpOAuthProtectedRouter.use(oauthErrorHandler);
