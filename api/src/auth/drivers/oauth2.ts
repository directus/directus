import { Knex } from 'knex';
import { Router } from 'express';
import { Issuer, Client, TokenSet, generators, ClientMetadata, CallbackParamsType, errors } from 'openid-client';
import env from '../../env';
import { getAuthProvider } from '../../auth';
import { UsersService } from '../../services';
import { LocalAuthDriver } from './local';
import { AuthDriverOptions, User, SessionData } from '../../types';
import { InvalidCredentialsException, ServiceUnavailableException } from '../../exceptions';
import { transformObject } from '../../utils/transform-object';
import { respond } from '../../middleware/respond';
import { Url } from '../../utils/url';
import { getSchema } from '../../utils/get-schema';

const isWhitelistedEmail = () => true;

export class OAuth2AuthDriver extends LocalAuthDriver {
	config: Record<string, any>;
	redirectUrl: string;
	usersService: UsersService;
	client: Client;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const { issuer: issuerName, authorizeUrl, accessUrl, client: clientConfig, ...additionalConfig } = config;

		const redirectUrl = new Url(env.PUBLIC_URL).addPath('auth', 'login', config.provider, 'callback');
		const issuer = new Issuer({
			issuer: issuerName,
			authorize_url: authorizeUrl,
			access_url: accessUrl,
		});

		this.config = additionalConfig;
		this.redirectUrl = redirectUrl.toString();
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.client = new issuer.Client({
			...transformObject(clientConfig, 'underscore'),
			redirect_uris: [this.redirectUrl],
			response_types: ['code'],
		} as ClientMetadata);
	}

	/**
	 * Generate secret session identifier
	 */
	generateCodeVerifier(): string {
		return generators.codeVerifier();
	}

	/**
	 * Generate redirect authentication URL
	 */
	generateAuthUrl(codeVerifier: string): string {
		try {
			return this.client.authorizationUrl({
				scope: this.config.scope ?? 'email',
				code_challenge: generators.codeChallenge(codeVerifier),
				code_challenge_method: 'S256',
			});
		} catch (e) {
			throw handleError(e);
		}
	}

	async fetchUserId(identifier: string): Promise<string | undefined> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', identifier.toLowerCase()])
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	/**
	 * Get user id by email or oauth id
	 */
	async getUserID(payload: Record<string, any>): Promise<string> {
		const { emailKey, identifierKey } = this.config;
		let tokenSet;

		try {
			const params = this.client.callbackParams(payload.request);
			// Fetch user tokens
			tokenSet = await this.client.callback(this.redirectUrl, params, {
				code_verifier: payload.codeVerifier,
			});
		} catch (e) {
			throw handleError(e);
		}

		const email = tokenSet[emailKey ?? 'email'] as string | undefined;
		// Fallback to email if explicit identifier not found
		const identifier = (tokenSet[identifierKey] as string | undefined) ?? email;

		if (!identifier) {
			throw new InvalidCredentialsException();
		}

		const userId = await this.fetchUserId(identifier);

		if (userId) {
			return userId;
		}

		if (!this.config.allowPublicRegistration || !isWhitelistedEmail()) {
			throw new InvalidCredentialsException();
		}

		// If the email is identifier, don't set "external_identifier"
		const emailIsIdentifier = email?.toLowerCase() === identifier.toLowerCase();

		await this.usersService.createOne({
			provider: this.config.provider,
			email: email,
			external_identifier: !emailIsIdentifier ? identifier : undefined,
			role: this.config.defaultRole,
		});

		return (await this.fetchUserId(identifier)) as string;
	}

	async login(_user: User, payload: Record<string, any>): Promise<SessionData> {
		try {
			const params = this.client.callbackParams(payload.request);
			// Store user tokens
			return await this.client.callback(this.redirectUrl, params, {
				code_verifier: payload.codeVerifier,
			});
		} catch (e) {
			throw handleError(e);
		}
	}

	/**
	 * Handle user session refresh
	 */
	async refresh(_user: User, sessionData: SessionData): Promise<SessionData> {
		if (!sessionData?.refresh_token) {
			return sessionData;
		}

		try {
			// Verify session
			const tokenSet = await this.client.refresh(sessionData.refresh_token);
			sessionData.access_token = tokenSet.access_token;
			return sessionData;
		} catch (e) {
			if (e instanceof errors.OPError) {
				// Server response error
				throw handleError(e);
			}
			throw e;
		}
	}

	/**
	 * Handle user session termination
	 */
	async logout(_user: User, sessionData: SessionData): Promise<void> {
		if (!sessionData?.access_token) {
			return;
		}

		try {
			// Revoke access token
			await this.client.revoke(sessionData.access_token);
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

export function createOAuth2AuthRouter(providerName: string): Router {
	const router = Router();

	router.get(
		'/',
		(req, res) => {
			const provider = getAuthProvider(providerName) as OAuth2AuthDriver;
			const codeVerifier = provider.generateCodeVerifier();

			res.cookie(
				`oauth2.${provider}`,
				{
					redirect: (req.query.redirect as string) || undefined,
					verifier: codeVerifier,
				},
				{
					maxAge: 5 * 60,
					httpOnly: true,
					sameSite: 'lax',
				}
			);

			return res.redirect(provider.generateAuthUrl(codeVerifier));
		},
		respond
	);

	return router;
}
