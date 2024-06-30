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
import { parseJSON } from '@directus/utils';
import express, { Router } from 'express';
import { flatten } from 'flat';
import jwt from 'jsonwebtoken';
import type { Client } from 'openid-client';
import { errors, generators, Issuer } from 'openid-client';
import { getAuthProvider } from '../../auth.js';
import { REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../constants.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger.js';
import { respond } from '../../middleware/respond.js';
import { AuthenticationService } from '../../services/authentication.js';
import { UsersService } from '../../services/users.js';
import type { AuthData, AuthDriverOptions, User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getSecret } from '../../utils/get-secret.js';
import { isLoginRedirectAllowed } from '../../utils/is-login-redirect-allowed.js';
import { Url } from '../../utils/url.js';
import { LocalAuthDriver } from './local.js';

export class OpenIDAuthDriver extends LocalAuthDriver {
	client: Promise<Client>;
	redirectUrl: string;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const env = useEnv();
		const logger = useLogger();

		const { issuerUrl, clientId, clientSecret, ...additionalConfig } = config;

		if (!issuerUrl || !clientId || !clientSecret || !additionalConfig['provider']) {
			logger.error('Invalid provider config');
			throw new InvalidProviderConfigError({ provider: additionalConfig['provider'] });
		}

		const redirectUrl = new Url(env['PUBLIC_URL'] as string).addPath(
			'auth',
			'login',
			additionalConfig['provider'],
			'callback',
		);

		const clientOptionsOverrides = getConfigFromEnv(
			`AUTH_${config['provider'].toUpperCase()}_CLIENT_`,
			[`AUTH_${config['provider'].toUpperCase()}_CLIENT_ID`, `AUTH_${config['provider'].toUpperCase()}_CLIENT_SECRET`],
			'underscore',
		);

		this.redirectUrl = redirectUrl.toString();
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = additionalConfig;

		this.client = new Promise((resolve, reject) => {
			Issuer.discover(issuerUrl)
				.then((issuer) => {
					const supportedTypes = issuer.metadata['response_types_supported'] as string[] | undefined;

					if (!supportedTypes?.includes('code')) {
						logger.error('OpenID provider does not support required code flow');

						reject(
							new InvalidProviderConfigError({
								provider: additionalConfig['provider'],
							}),
						);
					}

					resolve(
						new issuer.Client({
							client_id: clientId,
							client_secret: clientSecret,
							redirect_uris: [this.redirectUrl],
							response_types: ['code'],
							...clientOptionsOverrides,
						}),
					);
				})
				.catch((e) => {
					logger.error(e, '[OpenID] Failed to fetch provider config');
					process.exit(1);
				});
		});
	}

	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	async generateAuthUrl(codeVerifier: string, prompt = false): Promise<string> {
		const { plainCodeChallenge } = this.config;

		try {
			const client = await this.client;
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
			const client = await this.client;

			const codeChallenge = plainCodeChallenge
				? payload['codeVerifier']
				: generators.codeChallenge(payload['codeVerifier']);

			tokenSet = await client.callback(
				this.redirectUrl,
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

		// Flatten response to support dot indexes
		userInfo = flatten(userInfo) as Record<string, unknown>;

		const { provider, identifierKey, allowPublicRegistration, requireVerifiedEmail } = this.config;

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
			role: this.config['defaultRoleId'],
			auth_data: tokenSet.refresh_token && JSON.stringify({ refreshToken: tokenSet.refresh_token }),
		};

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			// Run hook so the end user has the chance to augment the
			// user that is about to be updated
			const updatedUserPayload = await emitter.emitFilter(
				`auth.update`,
				{ auth_data: userPayload.auth_data },
				{
					identifier,
					provider: this.config['provider'],
					providerPayload: { accessToken: tokenSet.access_token, userInfo },
				},
				{ database: getDatabase(), schema: this.schema, accountability: null },
			);

			// Update user to update refresh_token and other properties that might have changed
			if (Object.values(updatedUserPayload).some((value) => value !== undefined)) {
				await this.usersService.updateOne(userId, updatedUserPayload);
			}

			return userId;
		}

		const isEmailVerified = !requireVerifiedEmail || userInfo['email_verified'];

		// Is public registration allowed?
		if (!allowPublicRegistration || !isEmailVerified) {
			logger.warn(`[OpenID] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		// Run hook so the end user has the chance to augment the
		// user that is about to be created
		const updatedUserPayload = await emitter.emitFilter(
			`auth.create`,
			userPayload,
			{
				identifier,
				provider: this.config['provider'],
				providerPayload: { accessToken: tokenSet.access_token, userInfo },
			},
			{ database: getDatabase(), schema: this.schema, accountability: null },
		);

		try {
			await this.usersService.createOne(updatedUserPayload);
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
				const client = await this.client;
				const tokenSet = await client.refresh(authData['refreshToken']);

				// Update user refreshToken if provided
				if (tokenSet.refresh_token) {
					await this.usersService.updateOne(user.id, {
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

			if (isLoginRedirectAllowed(redirect, providerName) === false) {
				throw new InvalidPayloadError({ reason: `URL "${redirect}" can't be used to redirect after login` });
			}

			const token = jwt.sign({ verifier: codeVerifier, redirect, prompt }, getSecret(), {
				expiresIn: '5m',
				issuer: 'directus',
			});

			res.cookie(`openid.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
			});

			return res.redirect(await provider.generateAuthUrl(codeVerifier, prompt));
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
				tokenData = jwt.verify(req.cookies[`openid.${providerName}`], getSecret(), {
					issuer: 'directus',
				}) as {
					verifier: string;
					redirect?: string;
					prompt: boolean;
				};
			} catch (e: any) {
				logger.warn(e, `[OpenID] Couldn't verify OpenID cookie`);
				throw new InvalidCredentialsError();
			}

			const { verifier, redirect, prompt } = tokenData;

			const accountability: Accountability = {
				ip: getIPFromReq(req),
				role: null,
			};

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
					},
					{ session: authMode === 'session' },
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
