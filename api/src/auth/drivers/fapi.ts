import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	InvalidProviderError,
	InvalidTokenError,
	isDirectusError,
	ServiceUnavailableError,
} from '@directus/errors';
import type { Accountability } from '@directus/types';
import { parseJSON, toArray } from '@directus/utils';
import express, { Router } from 'express';
import { flatten } from 'flat';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Client } from 'openid-client';
import { custom, errors, generators, Issuer } from 'openid-client';
import { getAuthProvider } from '../../auth.js';
import { REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../constants.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { respond } from '../../middleware/respond.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { AuthenticationService } from '../../services/authentication.js';
import type { AuthData, AuthDriverOptions, User } from '../../types/index.js';
import type { RoleMap } from '../../types/rolemap.js';
import asyncHandler from '../../utils/async-handler.js';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getMilliseconds } from '../../utils/get-milliseconds.js';
import { getSchema } from '../../utils/get-schema.js';
import { getSecret } from '../../utils/get-secret.js';
import { verifyJWT } from '../../utils/jwt.js';
import { Url } from '../../utils/url.js';
import {
	dpopKeyFromJwk,
	dpopKeyToJwk,
	generateDpopKeypair,
	loadAndEvictHandshakeDpopKey,
	storeHandshakeDpopKey,
} from '../utils/dpop.js';
import { generateCallbackUrl } from '../utils/generate-callback-url.js';
import { type JwkSet, loadJwks } from '../utils/load-jwks.js';
import { resolveLoginRedirect } from '../utils/resolve-login-redirect.js';
import { LocalAuthDriver } from './local.js';

const FAPI_ALLOWED_SIG_ALGS = ['PS256', 'ES256'];

const DEFAULT_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function resolveLoginTimeoutMs(env: Record<string, unknown>, providerName: string): number {
	const raw = env[`AUTH_${providerName.toUpperCase()}_LOGIN_TIMEOUT`] ?? '5m';
	return getMilliseconds<number>(raw, DEFAULT_LOGIN_TIMEOUT_MS);
}

export class FAPIAuthDriver extends LocalAuthDriver {
	client: null | Client;
	config: Record<string, any>;
	roleMap: RoleMap;
	private publicJwksCache: JwkSet | null;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const logger = useLogger();

		const { clientPrivateKeys, clientTokenEndpointAuthMethod, provider, issuerUrl, clientId } = config;

		if (!issuerUrl || !clientId || !provider) {
			logger.error('[FAPI] Missing required config: issuerUrl, clientId, provider');
			throw new InvalidProviderConfigError({ provider: provider ?? 'fapi' });
		}

		if (clientTokenEndpointAuthMethod !== 'private_key_jwt') {
			logger.error('[FAPI] clientTokenEndpointAuthMethod must be private_key_jwt');
			throw new InvalidProviderConfigError({ provider });
		}

		if (!clientPrivateKeys) {
			logger.error('[FAPI] clientPrivateKeys is required for FAPI 2.0');
			throw new InvalidProviderConfigError({ provider });
		}

		// Validates key set: requires >=1 sig key with PS256/ES256, unique kids.
		// Throws InvalidProviderConfigError if invalid. Cache the parsed publicJwks so
		// the JWKS endpoint route doesn't re-parse on every request.
		const { publicJwks } = loadJwks(clientPrivateKeys, provider);
		this.publicJwksCache = publicJwks;

		this.config = config;
		this.roleMap = {};

		const roleMapping = config['roleMapping'];

		if (roleMapping) {
			this.roleMap = roleMapping;
		}

		if (roleMapping instanceof Array) {
			logger.error(
				"[FAPI] Expected a JSON-Object as role mapping, got an Array. Make sure you declare the variable with 'json:' prefix.",
			);

			throw new InvalidProviderError();
		}

		this.client = null;

		this.getClient().catch((e) => {
			logger.error(e, '[FAPI] Failed to fetch provider config');

			if (config['issuerDiscoveryMustSucceed'] !== false) {
				logger.error(
					`AUTH_${provider.toUpperCase()}_ISSUER_DISCOVERY_MUST_SUCCEED is enabled and discovery failed, exiting`,
				);

				process.exit(1);
			}
		});
	}

	private async getClient(): Promise<Client> {
		if (this.client) return this.client;

		const logger = useLogger();

		const { issuerUrl, clientId, clientPrivateKeys, provider } = this.config;

		const { privateJwks } = loadJwks(clientPrivateKeys, provider);

		const clientHttpOptions = getConfigFromEnv(`AUTH_${provider.toUpperCase()}_CLIENT_HTTP_`);

		if (clientHttpOptions) {
			Issuer[custom.http_options] = (_, options) => ({ ...options, ...clientHttpOptions });
		}

		const issuer = await Issuer.discover(issuerUrl);

		const supportedTypes = issuer.metadata['response_types_supported'] as string[] | undefined;

		if (!supportedTypes?.includes('code')) {
			logger.error('[FAPI] Provider does not support the required code flow');
			throw new InvalidProviderConfigError({ provider });
		}

		const supportedPar = issuer.metadata['pushed_authorization_request_endpoint'];

		if (!supportedPar) {
			logger.error(
				'[FAPI] Provider does not advertise a pushed_authorization_request_endpoint (required for FAPI 2.0)',
			);

			throw new InvalidProviderConfigError({ provider });
		}

		const clientOptionsOverrides = getConfigFromEnv(`AUTH_${provider.toUpperCase()}_CLIENT_`, {
			omitKey: [
				`AUTH_${provider.toUpperCase()}_CLIENT_ID`,
				`AUTH_${provider.toUpperCase()}_CLIENT_SECRET`,
				`AUTH_${provider.toUpperCase()}_CLIENT_PRIVATE_KEYS`,
			],
			omitPrefix: [`AUTH_${provider.toUpperCase()}_CLIENT_HTTP_`],
			type: 'underscore',
		});

		const idTokenSignedResponseAlg =
			this.config['clientIdTokenSignedResponseAlg'] ??
			clientOptionsOverrides['id_token_signed_response_alg'] ??
			'PS256';

		if (!FAPI_ALLOWED_SIG_ALGS.includes(idTokenSignedResponseAlg)) {
			logger.error(`[FAPI] id_token_signed_response_alg must be one of ${FAPI_ALLOWED_SIG_ALGS.join(', ')}`);
			throw new InvalidProviderConfigError({ provider });
		}

		const { hasEncryptionKey } = loadJwks(this.config['clientPrivateKeys'], provider);

		const encMeta: Record<string, string> = {};

		// Only opt into JWE decryption when an enc key is configured.
		// Setting *_encrypted_response_alg without a matching key causes openid-client
		// to reject plain-JWS tokens from non-encrypting IdPs.
		if (hasEncryptionKey) {
			const idTokenEncAlg =
				this.config['clientIdTokenEncryptedResponseAlg'] ?? clientOptionsOverrides['id_token_encrypted_response_alg'];

			const idTokenEncEnc =
				this.config['clientIdTokenEncryptedResponseEnc'] ??
				clientOptionsOverrides['id_token_encrypted_response_enc'] ??
				'A256GCM';

			const userinfoEncAlg =
				this.config['clientUserinfoEncryptedResponseAlg'] ?? clientOptionsOverrides['userinfo_encrypted_response_alg'];

			const userinfoEncEnc =
				this.config['clientUserinfoEncryptedResponseEnc'] ??
				clientOptionsOverrides['userinfo_encrypted_response_enc'] ??
				'A256GCM';

			if (idTokenEncAlg) {
				encMeta['id_token_encrypted_response_alg'] = idTokenEncAlg;
				encMeta['id_token_encrypted_response_enc'] = idTokenEncEnc;
			}

			if (userinfoEncAlg) {
				encMeta['userinfo_encrypted_response_alg'] = userinfoEncAlg;
				encMeta['userinfo_encrypted_response_enc'] = userinfoEncEnc;
			}
		}

		const client = new issuer.Client(
			{
				client_id: clientId,
				token_endpoint_auth_method: 'private_key_jwt',
				// Pin the client_assertion alg explicitly. openid-client@5 otherwise picks
				// based on key.alg; with multiple sig keys configured the behaviour is undefined.
				token_endpoint_auth_signing_alg: idTokenSignedResponseAlg,
				response_types: ['code'],
				id_token_signed_response_alg: idTokenSignedResponseAlg,
				...encMeta,
				...clientOptionsOverrides,
			},
			// Passing both sig and enc private keys lets openid-client:
			// (1) sign client_assertions for PAR / token endpoint
			// (2) auto-decrypt JWE id_tokens and encrypted userinfo responses
			{ keys: privateJwks.keys },
		);

		if (clientHttpOptions) {
			client[custom.http_options] = (_, options) => ({ ...options, ...clientHttpOptions });
		}

		this.client = client;

		return client;
	}

	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	generateNonce(): string {
		return generators.nonce();
	}

	/**
	 * Returns the validated public JWKS (private members stripped). Cached at
	 * construction time; this method is the single read path for the JWKS route
	 * so the route never re-parses keys on a hot path.
	 *
	 * Returns null when the loader either wasn't able to run (config mutated after
	 * construction) or produced an empty set — both surface as 503 to the caller.
	 */
	public getPublicJwks(): JwkSet | null {
		if (this.publicJwksCache) return this.publicJwksCache;

		const rawKeys = this.config['clientPrivateKeys'];
		if (!rawKeys) return null;

		try {
			const { publicJwks } = loadJwks(rawKeys, this.config['provider']);
			this.publicJwksCache = publicJwks;
			return publicJwks;
		} catch {
			return null;
		}
	}

	/**
	 * Override generateAuthUrl to use PAR (RFC 9126) instead of constructing a direct
	 * authorization URL. The browser only sees client_id + request_uri, keeping all
	 * auth parameters in the authenticated back-channel — FAPI 2.0 Security Profile §5.
	 *
	 * `handshakeTtlMs` is sourced from `AUTH_<P>_LOGIN_TIMEOUT` by the router and used
	 * for the DPoP handshake cache entry, so a slow consent / MFA screen can't evict
	 * the key before the callback arrives.
	 */
	async generateAuthUrl(
		codeVerifier: string,
		nonce: string,
		prompt = false,
		callbackUrl?: string,
		handshakeTtlMs: number = DEFAULT_LOGIN_TIMEOUT_MS,
	): Promise<string> {
		try {
			const client = await this.getClient();
			const codeChallenge = generators.codeChallenge(codeVerifier);
			const paramsConfig = typeof this.config['params'] === 'object' ? this.config['params'] : {};

			const state = codeChallenge;

			// Generate an ephemeral DPoP keypair for this login handshake.
			// Stored in cache keyed on (provider, state) so the callback handler can
			// retrieve it. One keypair per login — the same key must be used for PAR,
			// token exchange, and userinfo (RFC 9449 §5: cnf.jkt is bound to the access token).
			const dpopKey = generateDpopKeypair();
			await storeHandshakeDpopKey(this.config['provider'], state, dpopKey, handshakeTtlMs);

			const parResponse = await (client as any).pushedAuthorizationRequest(
				{
					response_type: 'code',
					scope: this.config['scope'] ?? 'openid',
					redirect_uri: callbackUrl,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					state,
					nonce,
					...paramsConfig,
					...(prompt ? { prompt: 'consent' } : {}),
				},
				{ DPoP: dpopKey.privateKey },
			);

			const authEndpoint = client.issuer.metadata['authorization_endpoint'] as string;

			// Use URL so IdPs that publish authorization_endpoint with embedded query
			// params (e.g. ".../authorize?env=prod") merge cleanly with our params.
			const url = new URL(authEndpoint);
			url.searchParams.set('client_id', client.metadata.client_id);
			url.searchParams.set('request_uri', parResponse.request_uri);
			return url.toString();
		} catch (e) {
			throw handleFapiError(e);
		}
	}

	private async fetchUserId(identifier: string): Promise<string | undefined> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	override async getUserID(payload: Record<string, any>): Promise<string> {
		const logger = useLogger();

		if (!payload['code'] || !payload['codeVerifier'] || !payload['state'] || !payload['nonce']) {
			logger.warn('[FAPI] No code, codeVerifier or state in payload');
			throw new InvalidCredentialsError();
		}

		const codeChallenge = generators.codeChallenge(payload['codeVerifier']);
		const state: string = payload['state'];

		// Retrieve the DPoP key that was used for PAR. The access token returned by
		// token exchange will have cnf.jkt bound to this key's thumbprint — we must use
		// the same key for userinfo (RFC 9449 §5). After successful token exchange and
		// user resolution the key migrates from cache → auth_data.
		const dpopKey = await loadAndEvictHandshakeDpopKey(this.config['provider'], state);

		if (!dpopKey) {
			logger.warn('[FAPI] DPoP handshake key missing or expired for state');
			throw new InvalidCredentialsError();
		}

		let tokenSet;
		let userInfo;

		try {
			const client = await this.getClient();

			tokenSet = await client.callback(
				payload['callbackUrl'],
				{ code: payload['code'], state, iss: payload['iss'] },
				{ code_verifier: payload['codeVerifier'], state: codeChallenge, nonce: payload['nonce'] },
				{ DPoP: dpopKey.privateKey } as any,
			);

			userInfo = tokenSet.claims();

			if (client.issuer.metadata['userinfo_endpoint']) {
				// Must use the same DPoP key — the access token's cnf.jkt is bound to it.
				const userinfoResponse = await client.userinfo(tokenSet.access_token!, {
					DPoP: dpopKey.privateKey,
				} as any);

				userInfo = { ...userInfo, ...userinfoResponse };
			}
		} catch (e) {
			throw handleFapiError(e);
		}

		let role = this.config['defaultRoleId'];
		const groupClaimName: string = this.config['groupClaimName'] ?? 'groups';
		const groups = userInfo[groupClaimName] ? toArray(userInfo[groupClaimName]) : [];

		if (groups.length > 0) {
			for (const key in this.roleMap) {
				if (groups.includes(key)) {
					role = this.roleMap[key];
					break;
				}
			}
		} else if (Object.keys(this.roleMap).length > 0) {
			logger.debug(`[FAPI] Configured group claim "${groupClaimName}" does not exist or is empty.`);
		}

		// flatten supports dot-path identifiers like sub_attributes.identity_number
		userInfo = flatten(userInfo) as Record<string, unknown>;

		const { provider, identifierKey, allowPublicRegistration, requireVerifiedEmail, syncUserInfo } = this.config;

		const email = userInfo['email'] ? String(userInfo['email']) : undefined;
		const identifier = userInfo[identifierKey ?? 'sub'] ? String(userInfo[identifierKey ?? 'sub']) : email;

		if (!identifier) {
			logger.warn(`[FAPI] Failed to find user identifier for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		// Serialize the DPoP private key alongside the refresh token. The key is promoted
		// from the short-lived handshake cache to auth_data (Postgres) so it survives restarts
		// and works across replicas. Concurrent logins for the same user race this row —
		// only the most recent login can refresh/userinfo. This matches OpenID driver behaviour.
		const authData = JSON.stringify({
			refreshToken: tokenSet.refresh_token,
			dpopPrivateJwk: dpopKeyToJwk(dpopKey),
		});

		const userPayload = {
			provider,
			first_name: userInfo['given_name'],
			last_name: userInfo['family_name'],
			email,
			external_identifier: identifier,
			role,
			auth_data: authData,
		};

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			let emitPayload: Record<string, unknown> = { auth_data: userPayload.auth_data };

			if (this.config['roleMapping']) {
				emitPayload['role'] = role;
			}

			if (syncUserInfo) {
				emitPayload = {
					...emitPayload,
					first_name: userPayload.first_name,
					last_name: userPayload.last_name,
					email: userPayload.email,
				};
			}

			const schema = await getSchema();

			const updatedUserPayload = await emitter.emitFilter(
				'auth.update',
				emitPayload,
				{
					identifier,
					provider: this.config['provider'],
					providerPayload: { accessToken: tokenSet.access_token, idToken: tokenSet.id_token, userInfo },
				},
				{ database: getDatabase(), schema, accountability: null },
			);

			if (Object.values(updatedUserPayload).some((value) => value !== undefined)) {
				const usersService = this.getUsersService(schema);
				await usersService.updateOne(userId, updatedUserPayload);
			}

			return userId;
		}

		const isEmailVerified = !requireVerifiedEmail || userInfo['email_verified'];

		if (!allowPublicRegistration || !isEmailVerified) {
			logger.warn(`[FAPI] User doesn't exist and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		const schema = await getSchema();

		const updatedUserPayload = await emitter.emitFilter(
			'auth.create',
			userPayload,
			{
				identifier,
				provider: this.config['provider'],
				providerPayload: { accessToken: tokenSet.access_token, idToken: tokenSet.id_token, userInfo },
			},
			{ database: getDatabase(), schema, accountability: null },
		);

		try {
			const usersService = this.getUsersService(schema);
			await usersService.createOne(updatedUserPayload);
		} catch (e) {
			if (isDirectusError(e, ErrorCode.RecordNotUnique)) {
				logger.warn(e, '[FAPI] Failed to register user. User not unique');
				throw new InvalidProviderError();
			}

			throw e;
		}

		return (await this.fetchUserId(identifier)) as string;
	}

	override async login(user: User): Promise<void> {
		return this.refresh(user);
	}

	override async refresh(user: User): Promise<void> {
		const logger = useLogger();

		let authData = user.auth_data as AuthData;

		if (typeof authData === 'string') {
			try {
				authData = parseJSON(authData);
			} catch {
				logger.warn(`[FAPI] Session data isn't valid JSON: ${authData}`);
			}
		}

		if (authData?.['refreshToken']) {
			try {
				const client = await this.getClient();

				// Reconstruct the DPoP key that was bound to the current access token.
				// The same key must be used for refresh (RFC 9449 §5).
				// TODO(directus-fapi-key-rotation): rotate the DPoP keypair on each refresh
				// per FAPI 2.0 §5 — generate a new keypair, pass to client.refresh as DPoP,
				// and persist the new private JWK alongside the rotated refresh token only
				// on success. Tracked separately so the rotation lands with a dedicated
				// regression test against the Keycloak fixture.
				const dpopKey = dpopKeyFromJwk(authData['dpopPrivateJwk'] as string | null);

				const tokenSet = await client.refresh(
					authData['refreshToken'],
					dpopKey ? ({ DPoP: dpopKey.privateKey } as any) : undefined,
				);

				if (tokenSet.refresh_token) {
					const usersService = this.getUsersService(await getSchema());

					await usersService.updateOne(user.id, {
						auth_data: JSON.stringify({
							refreshToken: tokenSet.refresh_token,
							dpopPrivateJwk: authData['dpopPrivateJwk'],
						}),
					});
				}
			} catch (e) {
				throw handleFapiError(e);
			}
		}
	}
}

const handleFapiError = (e: any) => {
	const logger = useLogger();

	if (e instanceof errors.OPError) {
		if (e.error === 'invalid_grant') {
			logger.warn(e, '[FAPI] Invalid grant');
			return new InvalidTokenError();
		}

		logger.warn(e, '[FAPI] Unknown OP error');
		return new ServiceUnavailableError({
			service: 'fapi',
			reason: `Service returned unexpected response: ${e.error_description}`,
		});
	} else if (e instanceof errors.RPError) {
		// RPErrors cover id_token signature failures, missing claims, JWKS lookup errors —
		// these are IdP or RP misconfiguration, not user-supplied credential problems.
		// Mapping them to InvalidCredentialsError would mask real incidents as user error.
		logger.warn(e, '[FAPI] RP-side validation error');
		return new ServiceUnavailableError({ service: 'fapi', reason: e.message });
	}

	logger.warn(e, '[FAPI] Unknown error');
	return e;
};

export function createFAPIAuthRouter(providerName: string): Router {
	const env = useEnv();
	const router = Router();

	router.get(
		'/jwks.json',
		asyncHandler(async (_req, res) => {
			const provider = getAuthProvider(providerName) as FAPIAuthDriver;
			const publicJwks = provider.getPublicJwks();

			if (!publicJwks) {
				useLogger().error(
					`[FAPI] JWKS load failed for provider "${providerName}" — clientPrivateKeys missing or malformed`,
				);

				return res.status(503).json({ error: 'JWKS not available — provider misconfigured' });
			}

			if (publicJwks.keys.length === 0) {
				useLogger().error(`[FAPI] JWKS is empty for provider "${providerName}"`);
				return res.status(503).json({ error: 'JWKS not available — no keys configured' });
			}

			res.setHeader('Content-Type', 'application/json');
			return res.json(publicJwks);
		}),
	);

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const provider = getAuthProvider(providerName) as FAPIAuthDriver;
			const codeVerifier = provider.generateCodeVerifier();
			const nonce = provider.generateNonce();
			const prompt = !!req.query['prompt'];
			let redirect = req.query['redirect'];
			const otp = req.query['otp'];

			try {
				redirect = resolveLoginRedirect(redirect, { provider: providerName });
			} catch (e) {
				useLogger().error(e);
				throw new InvalidPayloadError({ reason: `URL "${redirect}" can't be used to redirect after login` });
			}

			const callbackUrl = generateCallbackUrl(providerName, `${req.protocol}://${req.get('host')}`);

			// Resolve once and use for both the cookie expiry and the DPoP handshake
			// cache TTL so a slow consent / MFA screen can't evict the DPoP key while
			// the cookie is still valid.
			const loginTimeoutMs = resolveLoginTimeoutMs(env, providerName);

			const token = jwt.sign({ verifier: codeVerifier, nonce, redirect, prompt, otp, callbackUrl }, getSecret(), {
				expiresIn: (env[`AUTH_${providerName.toUpperCase()}_LOGIN_TIMEOUT`] ?? '5m') as StringValue | number,
				issuer: 'directus',
			});

			res.cookie(`fapi.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
				secure: Boolean(env[`AUTH_${providerName.toUpperCase()}_COOKIE_SECURE`]),
			});

			try {
				return res.redirect(await provider.generateAuthUrl(codeVerifier, nonce, prompt, callbackUrl, loginTimeoutMs));
			} catch {
				return res.redirect(
					new Url(env['PUBLIC_URL'] as string)
						.addPath('admin', 'login')
						.setQuery('reason', ErrorCode.ServiceUnavailable)
						.toString(),
				);
			}
		}),
		respond,
	);

	router.post(
		'/callback',
		express.urlencoded({ extended: false }),
		(req, res) => {
			res.redirect(303, `./callback?${new URLSearchParams(req.body)}`);
		},
		respond,
	);

	router.get(
		'/callback',
		asyncHandler(async (req, res, next) => {
			const logger = useLogger();

			let tokenData;

			try {
				tokenData = verifyJWT(req.cookies[`fapi.${providerName}`], getSecret()) as {
					verifier: string;
					nonce: string;
					redirect?: string;
					prompt: boolean;
					otp?: string;
					callbackUrl?: string;
				};
			} catch (e: any) {
				logger.warn(e, `[FAPI] Couldn't verify FAPI cookie`);
				const url = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'login');
				return res.redirect(`${url.toString()}?reason=${ErrorCode.InvalidCredentials}`);
			}

			const { verifier, nonce, prompt, otp, callbackUrl } = tokenData;
			let { redirect } = tokenData;

			const accountability: Accountability = createDefaultAccountability({ ip: getIPFromReq(req) });
			const userAgent = req.get('user-agent')?.substring(0, 1024);
			if (userAgent) accountability.userAgent = userAgent;

			const origin = req.get('origin');
			if (origin) accountability.origin = origin;

			const authenticationService = new AuthenticationService({
				accountability,
				schema: req.schema,
			});

			const authMode = (env[`AUTH_${providerName.toUpperCase()}_MODE`] ?? 'session') as string;

			let authResponse;

			try {
				res.clearCookie(`fapi.${providerName}`);

				authResponse = await authenticationService.login(
					providerName,
					{
						code: req.query['code'],
						codeVerifier: verifier,
						nonce,
						state: req.query['state'],
						iss: req.query['iss'],
						callbackUrl,
					},
					{ session: authMode === 'session', ...(otp ? { otp: String(otp) } : {}) },
				);
			} catch (error: any) {
				if (isDirectusError(error, ErrorCode.InvalidToken) && !prompt) {
					return res.redirect(`./?${redirect ? `redirect=${redirect}&` : ''}prompt=true`);
				}

				logger.warn(error);

				if (redirect) {
					let reason = 'UNKNOWN_EXCEPTION';

					if (isDirectusError(error)) {
						reason = error.code;
					} else {
						logger.warn(error, `[FAPI] Unexpected error during FAPI login`);
					}

					return res.redirect(`${redirect.split('?')[0]}?reason=${reason}`);
				}

				logger.warn(error, `[FAPI] Unexpected error during FAPI login`);
				throw error;
			}

			const { accessToken, refreshToken, expires } = authResponse;

			try {
				const claims = verifyJWT(accessToken, getSecret()) as any;

				if (claims?.enforce_tfa === true) {
					const url = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'tfa-setup');

					if (redirect) {
						url.setQuery('redirect', redirect);
						url.setQuery('provider', providerName);
					}

					redirect = url.toString();
				}
			} catch (e) {
				logger.warn(e, `[FAPI] Unexpected error during FAPI login`);
			}

			if (redirect) {
				if (authMode === 'session') {
					res.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
				} else {
					res.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
				}

				return res.redirect(redirect);
			}

			res.locals['payload'] = {
				data: { access_token: accessToken, refresh_token: refreshToken, expires },
			};

			next();
		}),
		respond,
	);

	return router;
}
