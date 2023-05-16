import { BaseException } from '@directus/exceptions';
import type { Accountability } from '@directus/types';
import { parseJSON } from '@directus/utils';
import express, { Router } from 'express';
import flatten from 'flat';
import jwt from 'jsonwebtoken';
import type { Client } from 'openid-client';
import { errors, generators, Issuer } from 'openid-client';
import { getAuthProvider } from '../../auth.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import env from '../../env.js';
import { RecordNotUniqueException } from '../../exceptions/database/record-not-unique.js';
import {
	InvalidConfigException,
	InvalidCredentialsException,
	InvalidProviderException,
	InvalidTokenException,
	ServiceUnavailableException,
} from '../../exceptions/index.js';
import logger from '../../logger.js';
import { respond } from '../../middleware/respond.js';
import { AuthenticationService } from '../../services/authentication.js';
import { UsersService } from '../../services/users.js';
import type { AuthData, AuthDriverOptions, User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getMilliseconds } from '../../utils/get-milliseconds.js';
import { Url } from '../../utils/url.js';
import { LocalAuthDriver } from './local.js';

export class OpenIDAuthDriver extends LocalAuthDriver {
	client: Promise<Client>;
	redirectUrl: string;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const { issuerUrl, clientId, clientSecret, ...additionalConfig } = config;

		if (!issuerUrl || !clientId || !clientSecret || !additionalConfig['provider']) {
			throw new InvalidConfigException('Invalid provider config', { provider: additionalConfig['provider'] });
		}

		const redirectUrl = new Url(env['PUBLIC_URL']).addPath('auth', 'login', additionalConfig['provider'], 'callback');

		const clientOptionsOverrides = getConfigFromEnv(
			`AUTH_${config['provider'].toUpperCase()}_CLIENT_`,
			[`AUTH_${config['provider'].toUpperCase()}_CLIENT_ID`, `AUTH_${config['provider'].toUpperCase()}_CLIENT_SECRET`],
			'underscore'
		);

		this.redirectUrl = redirectUrl.toString();
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = additionalConfig;

		this.client = new Promise((resolve, reject) => {
			Issuer.discover(issuerUrl)
				.then((issuer) => {
					const supportedTypes = issuer.metadata['response_types_supported'] as string[] | undefined;

					if (!supportedTypes?.includes('code')) {
						reject(
							new InvalidConfigException('OpenID provider does not support required code flow', {
								provider: additionalConfig['provider'],
							})
						);
					}

					resolve(
						new issuer.Client({
							client_id: clientId,
							client_secret: clientSecret,
							redirect_uris: [this.redirectUrl],
							response_types: ['code'],
							...clientOptionsOverrides,
						})
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
		try {
			const client = await this.client;
			const codeChallenge = generators.codeChallenge(codeVerifier);
			const paramsConfig = typeof this.config['params'] === 'object' ? this.config['params'] : {};

			return client.authorizationUrl({
				scope: this.config['scope'] ?? 'openid profile email',
				access_type: 'offline',
				prompt: prompt ? 'consent' : undefined,
				...paramsConfig,
				code_challenge: codeChallenge,
				code_challenge_method: 'S256',
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
		if (!payload['code'] || !payload['codeVerifier'] || !payload['state']) {
			logger.warn('[OpenID] No code, codeVerifier or state in payload');
			throw new InvalidCredentialsException();
		}

		let tokenSet;
		let userInfo;

		try {
			const client = await this.client;
			const codeChallenge = generators.codeChallenge(payload['codeVerifier']);

			tokenSet = await client.callback(
				this.redirectUrl,
				{ code: payload['code'], state: payload['state'], iss: payload['iss'] },
				{ code_verifier: payload['codeVerifier'], state: codeChallenge, nonce: codeChallenge }
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
			throw new InvalidCredentialsException();
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
				{ auth_data: userPayload.auth_data ?? null },
				{
					identifier,
					provider: this.config['provider'],
					providerPayload: { accessToken: tokenSet.access_token, userInfo },
				},
				{ database: getDatabase(), schema: this.schema, accountability: null }
			);

			// Update user to update refresh_token and other properties that might have changed
			await this.usersService.updateOne(userId, updatedUserPayload);

			return userId;
		}

		const isEmailVerified = !requireVerifiedEmail || userInfo['email_verified'];

		// Is public registration allowed?
		if (!allowPublicRegistration || !isEmailVerified) {
			logger.warn(`[OpenID] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsException();
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
			{ database: getDatabase(), schema: this.schema, accountability: null }
		);

		try {
			await this.usersService.createOne(updatedUserPayload);
		} catch (e) {
			if (e instanceof RecordNotUniqueException) {
				logger.warn(e, '[OpenID] Failed to register user. User not unique');
				throw new InvalidProviderException();
			}

			throw e;
		}

		return (await this.fetchUserId(identifier)) as string;
	}

	override async login(user: User): Promise<void> {
		return this.refresh(user);
	}

	override async refresh(user: User): Promise<void> {
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
	if (e instanceof errors.OPError) {
		if (e.error === 'invalid_grant') {
			// Invalid token
			logger.trace(e, `[OpenID] Invalid grant`);
			return new InvalidTokenException();
		}

		// Server response error
		logger.trace(e, `[OpenID] Unknown OP error`);
		return new ServiceUnavailableException('Service returned unexpected response', {
			service: 'openid',
			message: e.error_description,
		});
	} else if (e instanceof errors.RPError) {
		// Internal client error
		logger.trace(e, `[OpenID] Unknown RP error`);
		return new InvalidCredentialsException();
	}

	logger.trace(e, `[OpenID] Unknown error`);
	return e;
};

export function createOpenIDAuthRouter(providerName: string): Router {
	const router = Router();

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const provider = getAuthProvider(providerName) as OpenIDAuthDriver;
			const codeVerifier = provider.generateCodeVerifier();
			const prompt = !!req.query['prompt'];

			const token = jwt.sign(
				{ verifier: codeVerifier, redirect: req.query['redirect'], prompt },
				env['SECRET'] as string,
				{
					expiresIn: '5m',
					issuer: 'directus',
				}
			);

			res.cookie(`openid.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
			});

			return res.redirect(await provider.generateAuthUrl(codeVerifier, prompt));
		}),
		respond
	);

	router.post(
		'/callback',
		express.urlencoded({ extended: false }),
		(req, res) => {
			res.redirect(303, `./callback?${new URLSearchParams(req.body)}`);
		},
		respond
	);

	router.get(
		'/callback',
		asyncHandler(async (req, res, next) => {
			let tokenData;

			try {
				tokenData = jwt.verify(req.cookies[`openid.${providerName}`], env['SECRET'] as string, {
					issuer: 'directus',
				}) as {
					verifier: string;
					redirect?: string;
					prompt: boolean;
				};
			} catch (e: any) {
				logger.warn(e, `[OpenID] Couldn't verify OpenID cookie`);
				throw new InvalidCredentialsException();
			}

			const { verifier, redirect, prompt } = tokenData;

			const accountability: Accountability = {
				ip: getIPFromReq(req),
				role: null,
			};

			const userAgent = req.get('user-agent');
			if (userAgent) accountability.userAgent = userAgent;

			const origin = req.get('origin');
			if (origin) accountability.origin = origin;

			const authenticationService = new AuthenticationService({
				accountability,
				schema: req.schema,
			});

			let authResponse;

			try {
				res.clearCookie(`openid.${providerName}`);

				authResponse = await authenticationService.login(providerName, {
					code: req.query['code'],
					codeVerifier: verifier,
					state: req.query['state'],
					iss: req.query['iss'],
				});
			} catch (error: any) {
				// Prompt user for a new refresh_token if invalidated
				if (error instanceof InvalidTokenException && !prompt) {
					return res.redirect(`./?${redirect ? `redirect=${redirect}&` : ''}prompt=true`);
				}

				logger.warn(error);

				if (redirect) {
					let reason = 'UNKNOWN_EXCEPTION';

					if (error instanceof BaseException) {
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
				res.cookie(env['REFRESH_TOKEN_COOKIE_NAME'], refreshToken, {
					httpOnly: true,
					domain: env['REFRESH_TOKEN_COOKIE_DOMAIN'],
					maxAge: getMilliseconds(env['REFRESH_TOKEN_TTL']),
					secure: env['REFRESH_TOKEN_COOKIE_SECURE'] ?? false,
					sameSite: (env['REFRESH_TOKEN_COOKIE_SAME_SITE'] as 'lax' | 'strict' | 'none') || 'strict',
				});

				return res.redirect(redirect);
			}

			res.locals['payload'] = {
				data: { access_token: accessToken, refresh_token: refreshToken, expires },
			};

			next();
		}),
		respond
	);

	return router;
}
