import * as validator from '@authenio/samlify-node-xmllint';
import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderError,
	isDirectusError,
} from '@directus/errors';
import express, { Router } from 'express';
import * as samlify from 'samlify';
import { getAuthProvider } from '../../auth.js';
import { REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../constants.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { respond } from '../../middleware/respond.js';
import { AuthenticationService } from '../../services/authentication.js';
import { UsersService } from '../../services/users.js';
import type { AuthDriverOptions, User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { LocalAuthDriver } from './local.js';
import { isLoginRedirectAllowed } from '../../utils/is-login-redirect-allowed.js';

// Register the samlify schema validator
samlify.setSchemaValidator(validator);

export class SAMLAuthDriver extends LocalAuthDriver {
	sp: samlify.ServiceProviderInstance;
	idp: samlify.IdentityProviderInstance;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		this.config = config;
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });

		this.sp = samlify.ServiceProvider(getConfigFromEnv(`AUTH_${config['provider'].toUpperCase()}_SP`));
		this.idp = samlify.IdentityProvider(getConfigFromEnv(`AUTH_${config['provider'].toUpperCase()}_IDP`));
	}

	async fetchUserID(identifier: string) {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	override async getUserID(payload: Record<string, any>) {
		const logger = useLogger();

		const { provider, emailKey, identifierKey, givenNameKey, familyNameKey, allowPublicRegistration } = this.config;

		const email = payload[emailKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
		const identifier = payload[identifierKey || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

		if (!identifier) {
			logger.warn(`[SAML] Failed to find user identifier for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		const userID = await this.fetchUserID(identifier);

		if (userID) return userID;

		if (!allowPublicRegistration) {
			logger.warn(`[SAML] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsError();
		}

		const firstName = payload[givenNameKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
		const lastName = payload[familyNameKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];

		const userPayload = {
			provider,
			first_name: firstName,
			last_name: lastName,
			email: email,
			external_identifier: identifier.toLowerCase(),
			role: this.config['defaultRoleId'],
		};

		// Run hook so the end user has the chance to augment the
		// user that is about to be created
		const updatedUserPayload = await emitter.emitFilter(
			`auth.create`,
			userPayload,
			{ identifier: identifier.toLowerCase(), provider: this.config['provider'], providerPayload: { ...payload } },
			{ database: getDatabase(), schema: this.schema, accountability: null },
		);

		try {
			return await this.usersService.createOne(updatedUserPayload);
		} catch (error) {
			if (isDirectusError(error, ErrorCode.RecordNotUnique)) {
				logger.warn(error, '[SAML] Failed to register user. User not unique');
				throw new InvalidProviderError();
			}

			throw error;
		}
	}

	// There's no local checks to be done when the user is authenticated in the IdP
	override async login(_user: User): Promise<void> {
		return;
	}
}

export function createSAMLAuthRouter(providerName: string) {
	const router = Router();
	const env = useEnv();

	router.get(
		'/metadata',
		asyncHandler(async (_req, res) => {
			const { sp } = getAuthProvider(providerName) as SAMLAuthDriver;
			return res.header('Content-Type', 'text/xml').send(sp.getMetadata());
		}),
	);

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { context: url } = sp.createLoginRequest(idp, 'redirect');
			const parsedUrl = new URL(url);

			if (req.query['redirect']) {
				const redirect = req.query['redirect'] as string;

				if (isLoginRedirectAllowed(redirect, providerName) === false) {
					throw new InvalidPayloadError({ reason: `URL "${redirect}" can't be used to redirect after login` });
				}

				parsedUrl.searchParams.append('RelayState', redirect);
			}

			return res.redirect(parsedUrl.toString());
		}),
	);

	router.post(
		'/logout',
		asyncHandler(async (req, res) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { context } = sp.createLogoutRequest(idp, 'redirect', req.body);

			const authService = new AuthenticationService({ accountability: req.accountability, schema: req.schema });
			const sessionCookieName = env['SESSION_COOKIE_NAME'] as string;

			if (req.cookies[sessionCookieName]) {
				await authService.logout(req.cookies[sessionCookieName]);
				res.clearCookie(sessionCookieName, SESSION_COOKIE_OPTIONS);
			}

			return res.redirect(context);
		}),
	);

	router.post(
		'/acs',
		express.urlencoded({ extended: false }),
		asyncHandler(async (req, res, next) => {
			const logger = useLogger();

			const relayState: string | undefined = req.body?.RelayState;

			const authMode = (env[`AUTH_${providerName.toUpperCase()}_MODE`] ?? 'session') as string;

			try {
				const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
				const { extract } = await sp.parseLoginResponse(idp, 'post', req);

				const authService = new AuthenticationService({ accountability: req.accountability, schema: req.schema });

				const { accessToken, refreshToken, expires } = await authService.login(providerName, extract.attributes, {
					session: authMode === 'session',
				});

				res.locals['payload'] = {
					data: {
						access_token: accessToken,
						refresh_token: refreshToken,
						expires,
					},
				};

				if (relayState) {
					if (authMode === 'session') {
						res.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
					} else {
						res.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
					}

					return res.redirect(relayState);
				}

				return next();
			} catch (error) {
				if (relayState) {
					let reason = 'UNKNOWN_EXCEPTION';

					if (isDirectusError(error)) {
						reason = error.code;
					} else {
						logger.warn(error, `[SAML] Unexpected error during SAML login`);
					}

					return res.redirect(`${relayState.split('?')[0]}?reason=${reason}`);
				}

				logger.warn(error, `[SAML] Unexpected error during SAML login`);
				throw error;
			}
		}),
		respond,
	);

	return router;
}
