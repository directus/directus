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
import { getSecret } from '../../utils/get-secret.js';
import { verifyJWT } from '../../utils/jwt.js';
import { Url } from '../../utils/url.js';
import { LocalAuthDriver } from './local.js';
import { getSchema } from '../../utils/get-schema.js';
import { generateProviderCallbackUrl } from '../utils/generate-provider-callback-url.js';
import { isLoginRedirectAllowed } from '../utils/is-login-redirect-allowed.js';

export class OpenIDAuthDriver extends LocalAuthDriver {
	client: null | Client;
	config: Record<string, any>;
	roleMap: RoleMap;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const logger = useLogger();

		const {
			issuerUrl,
			clientId,
			clientSecret,
			clientPrivateKeys,
			clientTokenEndpointAuthMethod,
			provider,
			issuerDiscoveryMustSucceed,
		} = config;

		const isPrivateKeyJwtAuthMethod = clientTokenEndpointAuthMethod === 'private_key_jwt';

		if (!issuerUrl || !clientId || !(clientSecret || (isPrivateKeyJwtAuthMethod && clientPrivateKeys)) || !provider) {
			logger.error('Invalid provider config');
			throw new InvalidProviderConfigError({ provider });
		}

		this.config = config;
		this.roleMap = {};

		const roleMapping = this.config['roleMapping'];

		if (roleMapping) {
			this.roleMap = roleMapping;
		}

		// role mapping will fail on login if AUTH_<provider>_ROLE_MAPPING is an array instead of an object.
		// This happens if the 'json:' prefix is missing from the variable declaration. To save the user from exhaustive debugging, we'll try to fail early here.
		if (roleMapping instanceof Array) {
			logger.error(
				"[OpenID] Expected a JSON-Object as role mapping, got an Array instead. Make sure you declare the variable with 'json:' prefix.",
			);

			throw new InvalidProviderError();
		}

		this.client = null;

		// preload client
		this.getClient().catch((e) => {
			logger.error(e, '[OpenID] Failed to fetch provider config');

			if (issuerDiscoveryMustSucceed !== false) {
				logger.error(
					`AUTH_${provider.toUpperCase()}_ISSUER_DISCOVERY_MUST_SUCCEED is enabled and discovery failed, exiting`,
				);

				process.exit(1);
			}
		});
	}

	private async getClient() {
		if (this.client) return this.client;

		const logger = useLogger();

		const { issuerUrl, clientId, clientSecret, clientPrivateKeys, clientTokenEndpointAuthMethod, provider } =
			this.config;

		const isPrivateKeyJwtAuthMethod = clientTokenEndpointAuthMethod === 'private_key_jwt';

		// extract client http overrides/options
		const clientHttpOptions = getConfigFromEnv(`AUTH_${provider.toUpperCase()}_CLIENT_HTTP_`);

		if (clientHttpOptions) {
			Issuer[custom.http_options] = (_, options) => {
				return {
					...options,
					...clientHttpOptions,
				};
			};
		}

		const issuer = await Issuer.discover(issuerUrl);

		const supportedTypes = issuer.metadata['response_types_supported'] as string[] | undefined;

		if (!supportedTypes?.includes('code')) {
			logger.error('OpenID provider does not support required code flow');
			throw new InvalidProviderConfigError({
				provider,
			});
		}

		// extract client overrides/options excluding CLIENT_ID and CLIENT_SECRET as they are passed directly
		const clientOptionsOverrides = getConfigFromEnv(`AUTH_${provider.toUpperCase()}_CLIENT_`, {
			omitKey: [
				`AUTH_${provider.toUpperCase()}_CLIENT_ID`,
				`AUTH_${provider.toUpperCase()}_CLIENT_SECRET`,
				`AUTH_${provider.toUpperCase()}_CLIENT_PRIVATE_KEYS`,
			],
			omitPrefix: [`AUTH_${provider.toUpperCase()}_CLIENT_HTTP_`],
			type: 'underscore',
		});

		const client = new issuer.Client(
			{
				client_id: clientId,
				...(!isPrivateKeyJwtAuthMethod && { client_secret: clientSecret }),
				response_types: ['code'],
				...clientOptionsOverrides,
			},
			isPrivateKeyJwtAuthMethod ? { keys: clientPrivateKeys } : undefined,
		);

		if (clientHttpOptions) {
			client[custom.http_options] = (_, options) => {
				return {
					...options,
					...clientHttpOptions,
				};
			};
		}

		this.client = client;

		return client;
	}

	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	async generateAuthUrl(codeVerifier: string, prompt = false, redirectUri?: string): Promise<string> {
		const { plainCodeChallenge } = this.config;

		try {
			const client = await this.getClient();
			const codeChallenge = plainCodeChallenge ? codeVerifier : generators.codeChallenge(codeVerifier);
			const paramsConfig = typeof this.config['params'] === 'object' ? this.config['params'] : {};

			return client.authorizationUrl({
				scope: this.config['scope'] ?? 'openid profile email',
				access_type: 'offline',
				prompt: prompt ? 'consent' : undefined,
				...paramsConfig,
				code_challenge: codeChallenge,
				code_challenge_method: plainCodeChallenge ? 'plain' : 'S256',
				// Some providers require state even with PKCE
				state: codeChallenge,
				nonce: codeChallenge,
				redirect_uri: redirectUri,
			});
		} catch (e) {
			throw handleError(e);
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

		if (!payload['code'] || !payload['codeVerifier'] || !payload['state']) {
			logger.warn('[OpenID] No code, codeVerifier or state in payload');
			throw new InvalidCredentialsError();
		}

		const { plainCodeChallenge } = this.config;

		let tokenSet;
		let userInfo;

		try {
			const client = await this.getClient();

			const codeChallenge = plainCodeChallenge
				? payload['codeVerifier']
				: generators.codeChallenge(payload['codeVerifier']);

			tokenSet = await client.callback(
				payload['callbackUrl'],
				{ code: payload['code'], state: payload['state'], iss: payload['iss'] },
				{ code_verifier: payload['codeVerifier'], state: codeChallenge, nonce: codeChallenge },
			);

			userInfo = tokenSet.claims();

			if (client.issuer.metadata['userinfo_endpoint']) {
				userInfo = {
					...userInfo,
					...(await client.userinfo(tokenSet.access_token!)),
				};
			}
		} catch (e) {
			throw handleError(e);
		}

		let role = this.config['defaultRoleId'];
		const groupClaimName: string = this.config['groupClaimName'] ?? 'groups';
		const groups = userInfo[groupClaimName] ? toArray(userInfo[groupClaimName]) : [];

		if (groups.length > 0) {
			for (const key in this.roleMap) {
				if (groups.includes(key)) {
					// Overwrite default role if user is member of a group specified in roleMap
					role = this.roleMap[key];
					break;
				}
			}
		} else if (Object.keys(this.roleMap).length > 0) {
			logger.debug(`[OpenID] Configured group claim with name "${groupClaimName}" does not exist or is empty.`);
		}

		// Flatten response to support dot indexes
		userInfo = flatten(userInfo) as Record<string, unknown>;

		const { provider, identifierKey, allowPublicRegistration, requireVerifiedEmail, syncUserInfo } = this.config;

		const email = userInfo['email'] ? String(userInfo['email']) : undefined;
		// Fallback to email if explicit identifier not found
		const identifier = userInfo[identifierKey ?? 'sub'] ? String(userInfo[identifierKey ?? 'sub']) : email;

		if (!identifier) {
			logger.warn(`[OpenID] Failed to find user identifier for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		const userPayload = {
			provider,
			first_name: userInfo['given_name'],
			last_name: userInfo['family_name'],
			email: email,
			external_identifier: identifier,
			role: role,
			auth_data: tokenSet.refresh_token && JSON.stringify({ refreshToken: tokenSet.refresh_token }),
		};

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			// Run hook so the end user has the chance to augment the
			// user that is about to be updated
			let emitPayload: Record<string, unknown> = {
				auth_data: userPayload.auth_data,
			};

			// Make sure a user's role gets updated if their openid group or role mapping changes
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
				`auth.update`,
				emitPayload,
				{
					identifier,
					provider: this.config['provider'],
					providerPayload: { accessToken: tokenSet.access_token, idToken: tokenSet.id_token, userInfo },
				},
				{ database: getDatabase(), schema, accountability: null },
			);

			// Update user to update refresh_token and other properties that might have changed
			if (Object.values(updatedUserPayload).some((value) => value !== undefined)) {
				const usersService = this.getUsersService(schema);
				await usersService.updateOne(userId, updatedUserPayload);
			}

			return userId;
		}

		const isEmailVerified = !requireVerifiedEmail || userInfo['email_verified'];

		// Is public registration allowed?
		if (!allowPublicRegistration || !isEmailVerified) {
			logger.warn(`[OpenID] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		const schema = await getSchema();

		// Run hook so the end user has the chance to augment the
		// user that is about to be created
		const updatedUserPayload = await emitter.emitFilter(
			`auth.create`,
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
				logger.warn(e, '[OpenID] Failed to register user. User not unique');
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
				logger.warn(`[OpenID] Session data isn't valid JSON: ${authData}`);
			}
		}

		if (authData?.['refreshToken']) {
			try {
				const client = await this.getClient();
				const tokenSet = await client.refresh(authData['refreshToken']);

				// Update user refreshToken if provided
				if (tokenSet.refresh_token) {
					const usersService = this.getUsersService(await getSchema());

					await usersService.updateOne(user.id, {
						auth_data: JSON.stringify({ refreshToken: tokenSet.refresh_token }),
					});
				}
			} catch (e) {
				throw handleError(e);
			}
		}
	}
}

const handleError = (e: any) => {
	const logger = useLogger();

	if (e instanceof errors.OPError) {
		if (e.error === 'invalid_grant') {
			// Invalid token
			logger.warn(e, `[OpenID] Invalid grant`);
			return new InvalidTokenError();
		}

		// Server response error
		logger.warn(e, `[OpenID] Unknown OP error`);
		return new ServiceUnavailableError({
			service: 'openid',
			reason: `Service returned unexpected response: ${e.error_description}`,
		});
	} else if (e instanceof errors.RPError) {
		// Internal client error
		logger.warn(e, `[OpenID] Unknown RP error`);
		return new InvalidCredentialsError();
	}

	logger.warn(e, `[OpenID] Unknown error`);
	return e;
};

export function createOpenIDAuthRouter(providerName: string): Router {
	const env = useEnv();
	const router = Router();

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const provider = getAuthProvider(providerName) as OpenIDAuthDriver;
			const codeVerifier = provider.generateCodeVerifier();
			const prompt = !!req.query['prompt'];
			const redirect = req.query['redirect'];
			const otp = req.query['otp'];

			if (!isLoginRedirectAllowed(redirect, req, providerName)) {
				throw new InvalidPayloadError({ reason: `URL "${redirect}" can't be used to redirect after login` });
			}

			const callbackUrl = generateProviderCallbackUrl(req, providerName);

			const token = jwt.sign(
				{
					verifier: codeVerifier,
					redirect,
					prompt,
					otp,
					callbackUrl,
				},
				getSecret(),
				{
					expiresIn: (env[`AUTH_${providerName.toUpperCase()}_LOGIN_TIMEOUT`] ?? '5m') as StringValue | number,
					issuer: 'directus',
				},
			);

			res.cookie(`openid.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
			});

			try {
				return res.redirect(await provider.generateAuthUrl(codeVerifier, prompt, callbackUrl));
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
			const env = useEnv();
			const logger = useLogger();

			let tokenData;

			try {
				tokenData = verifyJWT(req.cookies[`openid.${providerName}`], getSecret()) as {
					verifier: string;
					redirect?: string;
					prompt: boolean;
					otp?: string;
					callbackUrl?: string;
				};
			} catch (e: any) {
				logger.warn(e, `[OpenID] Couldn't verify OpenID cookie`);
				const url = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'login');
				return res.redirect(`${url.toString()}?reason=${ErrorCode.InvalidCredentials}`);
			}

			const { verifier, prompt, otp, callbackUrl } = tokenData;
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
				res.clearCookie(`openid.${providerName}`);

				authResponse = await authenticationService.login(
					providerName,
					{
						code: req.query['code'],
						codeVerifier: verifier,
						state: req.query['state'],
						iss: req.query['iss'],
						callbackUrl,
					},
					{ session: authMode === 'session', ...(otp ? { otp: String(otp) } : {}) },
				);
			} catch (error: any) {
				// Prompt user for a new refresh_token if invalidated
				if (isDirectusError(error, ErrorCode.InvalidToken) && !prompt) {
					return res.redirect(`./?${redirect ? `redirect=${redirect}&` : ''}prompt=true`);
				}

				logger.warn(error);

				if (redirect) {
					let reason = 'UNKNOWN_EXCEPTION';

					if (isDirectusError(error)) {
						reason = error.code;
					} else {
						logger.warn(error, `[OpenID] Unexpected error during OpenID login`);
					}

					return res.redirect(`${redirect.split('?')[0]}?reason=${reason}`);
				}

				logger.warn(error, `[OpenID] Unexpected error during OpenID login`);
				throw error;
			}

			const { accessToken, refreshToken, expires } = authResponse;

			try {
				const claims = verifyJWT(accessToken, getSecret()) as any;

				if (claims?.enforce_tfa === true) {
					const url = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'tfa-setup');
					if (redirect) url.setQuery('redirect', redirect);

					redirect = url.toString();
				}
			} catch (e) {
				logger.warn(e, `[OpenID] Unexpected error during OpenID login`);
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
