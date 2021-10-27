import { Router } from 'express';
import { Issuer, Client, generators, errors } from 'openid-client';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { LocalAuthDriver } from './local';
import { getAuthProvider } from '../../auth';
import env from '../../env';
import { AuthenticationService, UsersService } from '../../services';
import { AuthDriverOptions, User, AuthData, SessionData } from '../../types';
import { InvalidCredentialsException, ServiceUnavailableException, InvalidConfigException } from '../../exceptions';
import { respond } from '../../middleware/respond';
import asyncHandler from '../../utils/async-handler';
import { Url } from '../../utils/url';
import logger from '../../logger';

export class OAuth2AuthDriver extends LocalAuthDriver {
	client: Client;
	redirectUrl: string;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const { authorizeUrl, accessUrl, profileUrl, clientId, clientSecret, ...additionalConfig } = config;

		if (!authorizeUrl || !accessUrl || !profileUrl || !clientId || !clientSecret || !additionalConfig.provider) {
			throw new InvalidConfigException('Invalid provider config', { provider: additionalConfig.provider });
		}

		const redirectUrl = new Url(env.PUBLIC_URL).addPath('auth', 'login', additionalConfig.provider, 'callback');

		this.redirectUrl = redirectUrl.toString();
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = additionalConfig;

		const issuer = new Issuer({
			authorization_endpoint: authorizeUrl,
			token_endpoint: accessUrl,
			userinfo_endpoint: profileUrl,
			issuer: additionalConfig.provider,
		});

		this.client = new issuer.Client({
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uris: [this.redirectUrl],
			response_types: ['code'],
		});
	}

	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	generateAuthUrl(codeVerifier: string): string {
		try {
			return this.client.authorizationUrl({
				scope: this.config.scope ?? 'email',
				code_challenge: generators.codeChallenge(codeVerifier),
				code_challenge_method: 'S256',
				access_type: 'offline',
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

	async getUserID(payload: Record<string, any>): Promise<string> {
		if (!payload.code || !payload.codeVerifier) {
			throw new InvalidCredentialsException();
		}

		let tokenSet;
		let userInfo;

		try {
			tokenSet = await this.client.grant({
				grant_type: 'authorization_code',
				code: payload.code,
				redirect_uri: this.redirectUrl,
				code_verifier: payload.codeVerifier,
			});
			userInfo = await this.client.userinfo(tokenSet);
		} catch (e) {
			throw handleError(e);
		}

		const { emailKey, identifierKey, allowPublicRegistration } = this.config;

		const email = userInfo[emailKey ?? 'email'] as string | undefined;
		// Fallback to email if explicit identifier not found
		const identifier = (userInfo[identifierKey] as string | undefined) ?? email;

		if (!identifier) {
			logger.warn(`Failed to find user identifier for provider "${this.config.provider}"`);
			throw new InvalidCredentialsException();
		}

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			// Update user refreshToken if provided
			if (tokenSet.refresh_token) {
				await this.usersService.updateOne(userId, {
					auth_data: JSON.stringify({ refreshToken: tokenSet.refresh_token }),
				});
			}
			return userId;
		}

		// Is public registration allowed?
		if (!allowPublicRegistration) {
			throw new InvalidCredentialsException();
		}

		await this.usersService.createOne({
			provider: this.config.provider,
			email: email,
			external_identifier: identifier,
			role: this.config.defaultRoleId,
			auth_data: tokenSet.refresh_token && JSON.stringify({ refreshToken: tokenSet.refresh_token }),
		});

		return (await this.fetchUserId(identifier)) as string;
	}

	async login(user: User, sessionData: SessionData): Promise<SessionData> {
		return this.refresh(user, sessionData);
	}

	async refresh(user: User, sessionData: SessionData): Promise<SessionData> {
		let authData = user.auth_data as AuthData;

		if (typeof authData === 'string') {
			try {
				authData = JSON.parse(authData);
			} catch {
				logger.warn(`Session data isn't valid JSON: ${authData}`);
			}
		}

		if (!authData?.refreshToken) {
			return sessionData;
		}

		try {
			const tokenSet = await this.client.refresh(authData.refreshToken);
			return { accessToken: tokenSet.access_token };
		} catch (e) {
			throw handleError(e);
		}
	}
}

const handleError = (e: any) => {
	if (e instanceof errors.OPError) {
		if (e.error === 'invalid_grant') {
			// Invalid token
			return new InvalidCredentialsException();
		}
		// Server response error
		return new ServiceUnavailableException('Service returned unexpected response', {
			service: 'openid',
			message: e.error_description,
		});
	} else if (e instanceof errors.RPError) {
		// Internal client error
		return new InvalidCredentialsException();
	}
	return e;
};

export function createOAuth2AuthRouter(providerName: string): Router {
	const router = Router();

	router.get(
		'/',
		(req, res) => {
			const provider = getAuthProvider(providerName) as OAuth2AuthDriver;
			const codeVerifier = provider.generateCodeVerifier();
			const token = jwt.sign({ verifier: codeVerifier, redirect: req.query.redirect }, env.SECRET as string, {
				expiresIn: '5m',
				issuer: 'directus',
			});

			res.cookie(`oauth2.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
			});

			return res.redirect(provider.generateAuthUrl(codeVerifier));
		},
		respond
	);

	router.get(
		'/callback',
		asyncHandler(async (req, res, next) => {
			let tokenData;

			try {
				tokenData = jwt.verify(req.cookies[`oauth2.${providerName}`], env.SECRET as string, { issuer: 'directus' }) as {
					verifier: string;
					redirect?: string;
				};
			} catch (e) {
				throw new InvalidCredentialsException();
			}

			const { verifier, redirect } = tokenData;

			const authenticationService = new AuthenticationService({
				accountability: {
					ip: req.ip,
					userAgent: req.get('user-agent'),
					role: null,
				},
				schema: req.schema,
			});

			let authResponse;

			try {
				res.clearCookie(`oauth2.${providerName}`);

				if (!req.query.code) {
					logger.warn(`Couldn't extract OAuth2 code from query: ${JSON.stringify(req.query)}`);
				}

				authResponse = await authenticationService.login(providerName, {
					code: req.query.code,
					codeVerifier: verifier,
				});
			} catch (error: any) {
				logger.warn(error);

				if (redirect) {
					let reason = 'UNKNOWN_EXCEPTION';

					if (error instanceof ServiceUnavailableException) {
						reason = 'SERVICE_UNAVAILABLE';
					} else if (error instanceof InvalidCredentialsException) {
						reason = 'INVALID_USER';
					}

					return res.redirect(`${redirect.split('?')[0]}?reason=${reason}`);
				}

				throw error;
			}

			const { accessToken, refreshToken, expires } = authResponse;

			if (redirect) {
				res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
					httpOnly: true,
					domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
					maxAge: ms(env.REFRESH_TOKEN_TTL as string),
					secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
					sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
				});

				return res.redirect(redirect);
			}

			res.locals.payload = {
				data: { access_token: accessToken, refresh_token: refreshToken, expires },
			};

			next();
		}),
		respond
	);

	return router;
}
