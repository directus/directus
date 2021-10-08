import { Router } from 'express';
import { Issuer, Client, generators, errors } from 'openid-client';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { LocalAuthDriver } from './local';
import { getAuthProvider } from '../../auth';
import env from '../../env';
import { AuthenticationService, UsersService } from '../../services';
import { AuthDriverOptions, User, SessionData } from '../../types';
import { InvalidCredentialsException, ServiceUnavailableException, InvalidConfigException } from '../../exceptions';
import { respond } from '../../middleware/respond';
import asyncHandler from '../../utils/async-handler';
import isEmailAllowed from '../../utils/is-email-allowed';
import { Url } from '../../utils/url';
import logger from '../../logger';

interface OpenIDTokens {
	accessToken: string;
	refreshToken: string;
}

export class OpenIDAuthDriver extends LocalAuthDriver {
	client: Promise<Client>;
	redirectUrl: string;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const { issuerUrl, clientId, clientSecret, ...additionalConfig } = config;

		if (!issuerUrl || !clientId || !clientSecret || !additionalConfig.provider || !additionalConfig.defaultRoleId) {
			throw new InvalidConfigException('Invalid provider config', { provider: additionalConfig.provider });
		}

		const redirectUrl = new Url(env.PUBLIC_URL).addPath('auth', 'login', additionalConfig.provider, 'callback');

		this.redirectUrl = redirectUrl.toString();
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = additionalConfig;
		this.client = new Promise((resolve, reject) => {
			Issuer.discover(issuerUrl)
				.then((issuer) => {
					resolve(
						new issuer.Client({
							client_id: clientId,
							client_secret: clientSecret,
							redirect_uris: [this.redirectUrl],
							response_types: ['code'],
						})
					);
				})
				.catch(reject);
		});
	}

	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	async generateAuthUrl(codeVerifier: string): Promise<string> {
		try {
			const client = await this.client;
			return client.authorizationUrl({
				scope: this.config.scope ?? 'email',
				code_challenge: generators.codeChallenge(codeVerifier),
				code_challenge_method: 'S256',
				access_type: 'offline',
				prompt: 'consent',
			});
		} catch (e) {
			throw handleError(e);
		}
	}

	async fetchUserTokens(code: string, codeVerifier: string): Promise<OpenIDTokens> {
		try {
			const client = await this.client;
			const tokenSet = await client.callback(this.redirectUrl, { code }, { code_verifier: codeVerifier });

			return { accessToken: tokenSet.access_token!, refreshToken: tokenSet.refresh_token! };
		} catch (e) {
			throw handleError(e);
		}
	}

	private async fetchUserId(identifier: string): Promise<string | undefined> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', identifier.toLowerCase()])
			.orWhereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	async getUserID(payload: Record<string, any>): Promise<string> {
		if (!payload.accessToken) {
			throw new InvalidCredentialsException();
		}

		let userInfo;

		try {
			const client = await this.client;
			userInfo = await client.userinfo(payload.accessToken);
		} catch (e) {
			throw handleError(e);
		}

		const { identifierKey, allowPublicRegistration, allowedEmailDomains, requireVerifiedEmail } = this.config;

		const email = userInfo.email as string;
		// Fallback to email if explicit identifier not found
		const identifier = (userInfo[identifierKey ?? 'sub'] as string | undefined) ?? email;

		if (!identifier) {
			// TODO: What do we throw here?
			throw new InvalidCredentialsException();
		}

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			return userId;
		}

		const isAllowedEmail = email && allowedEmailDomains && isEmailAllowed(email, allowedEmailDomains);
		const isEmailVerified = !requireVerifiedEmail || userInfo.email_verified;

		// Is public registration allowed?
		if (!allowPublicRegistration && !isAllowedEmail && !isEmailVerified) {
			throw new InvalidCredentialsException();
		}

		// If email matches identifier, don't set "external_identifier"
		const emailIsIdentifier = email?.toLowerCase() === identifier.toLowerCase();

		await this.usersService.createOne({
			provider: this.config.provider,
			first_name: userInfo.given_name,
			last_name: userInfo.family_name,
			email: email,
			external_identifier: !emailIsIdentifier ? identifier : undefined,
			role: this.config.defaultRoleId,
		});

		return (await this.fetchUserId(identifier)) as string;
	}

	async login(_user: User, payload: Record<string, any>): Promise<SessionData> {
		// TODO: We could add a refresh call here to ensure if the login function
		// is called manually, some actual verification will be done
		return {
			accessToken: payload.accessToken,
			refreshToken: payload.refreshToken,
		};
	}

	async refresh(user: User, sessionData: SessionData): Promise<SessionData> {
		if (!sessionData?.refreshToken) {
			return sessionData;
		}

		try {
			const client = await this.client;
			const tokenSet = await client.refresh(sessionData.refreshToken);
			return {
				...sessionData,
				accessToken: tokenSet.access_token,
			};
		} catch (e) {
			if (e instanceof errors.OPError) {
				// Server response error
				throw handleError(e);
			}
			throw e;
		}
	}

	async logout(_user: User, sessionData: SessionData): Promise<void> {
		if (!sessionData?.accessToken) {
			return;
		}

		try {
			const client = await this.client;
			await client.revoke(sessionData.accessToken);
		} catch (e) {
			if (e instanceof errors.OPError) {
				// Server response error
				return;
			}
			throw e;
		}
	}
}

const handleError = (e: any) => {
	if (e instanceof errors.OPError) {
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

export function createOpenIDAuthRouter(providerName: string): Router {
	const router = Router();

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const provider = getAuthProvider(providerName) as OpenIDAuthDriver;
			const codeVerifier = provider.generateCodeVerifier();
			const token = jwt.sign({ verifier: codeVerifier, redirect: req.query.redirect }, env.SECRET as string, {
				expiresIn: '5m',
				issuer: 'directus',
			});

			res.cookie(`openid.${providerName}`, token, {
				httpOnly: true,
				sameSite: 'lax',
			});

			return res.redirect(await provider.generateAuthUrl(codeVerifier));
		}),
		respond
	);

	router.get(
		'/callback',
		asyncHandler(async (req, res, next) => {
			const token = req.cookies[`openid.${providerName}`];
			const { verifier, redirect } = jwt.verify(token, env.SECRET as string, { issuer: 'directus' }) as {
				verifier: string;
				redirect: string;
			};

			const authenticationService = new AuthenticationService({
				accountability: {
					ip: req.ip,
					userAgent: req.get('user-agent'),
					role: null,
				},
				schema: req.schema,
			});

			let authResponse: { accessToken: any; refreshToken: any; expires: any; id?: any };

			try {
				res.clearCookie(`openid.${providerName}`);

				const provider = getAuthProvider(providerName) as OpenIDAuthDriver;
				const userTokens = await provider.fetchUserTokens(req.query.code as string, verifier);

				authResponse = await authenticationService.login(providerName, userTokens);
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
