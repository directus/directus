import * as validator from '@authenio/samlify-node-xmllint';
import express, { Router } from 'express';
import { access } from 'fs';
import * as samlify from 'samlify';
import flatten from 'flat';
import logger from '../../logger';
import { getAuthProvider } from '../../auth';
import { COOKIE_OPTIONS } from '../../constants';
import env from '../../env';
import { RecordNotUniqueException } from '../../exceptions/database/record-not-unique';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials';
import { respond } from '../../middleware/respond';
import { AuthenticationService, UsersService } from '../../services';
import { AuthDriverOptions, User } from '../../types';
import asyncHandler from '../../utils/async-handler';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import { LocalAuthDriver } from './local';

samlify.setSchemaValidator(validator);

export class SAMLAuthDriver extends LocalAuthDriver {
	idp: any;
	sp: any;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		this.config = config;
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.sp = samlify.ServiceProvider(getConfigFromEnv(`AUTH_${config.provider.toUpperCase()}_SP`));
		this.idp = samlify.IdentityProvider(getConfigFromEnv(`AUTH_${config.provider.toUpperCase()}_IDP`));
	}

	async fetchUserID(identifier: string) {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['external_identifier', identifier.toLowerCase()])
			.first();

		return user?.id;
	}

	async getUserID(payload: Record<string, any>) {
		const { provider, emailKey, identifierKey, allowPublicRegistration } = this.config;

		const email = payload[emailKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
		const identifier = payload[identifierKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
		const userID = await this.fetchUserID(identifier);

		let userInfo = {
			name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
			given_name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
			family_name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
			email,
		};

		if (userID) return userID;

		userInfo = flatten(userInfo) as Record<string, unknown>;

		// Is public registration allowed?
		if (!allowPublicRegistration) {
			logger.trace(`[Saml] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsException();
		}

		try {
			await this.usersService.createOne({
				provider,
				first_name: userInfo.given_name,
				last_name: userInfo.family_name,
				email: email,
				external_identifier: identifier,
				role: this.config.defaultRoleId,
				//auth_data: tokenSet.refresh_token && JSON.stringify({ refreshToken: tokenSet.refresh_token }),
			});
			const userID = await this.fetchUserID(identifier);
			if (userID) return userID;
		} catch (e) {
			if (e instanceof RecordNotUniqueException) {
				logger.warn(e, '[Saml] Failed to register user. User not unique');
				throw new InvalidProviderException();
			}
			throw e;
		}

		throw new InvalidCredentialsException();
	}

	async login(user: User) {}
}

export function createSAMLAuthRouter(providerName: string) {
	const router = Router();

	router.get(
		'/metadata',
		asyncHandler(async (req, res, next) => {
			const { sp } = getAuthProvider(providerName) as SAMLAuthDriver;
			return res.header('Content-Type', 'text/xml').send(sp.getMetadata());
		})
	);

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { context } = await sp.createLoginRequest(idp, 'redirect');
			return res.redirect(context);
		})
	);

	router.post(
		'/acs',
		express.urlencoded({ extended: false }),
		asyncHandler(async (req, res, next) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { extract } = await sp.parseLoginResponse(idp, 'post', req);

			const authService = new AuthenticationService({ accountability: req.accountability, schema: req.schema });
			const { accessToken, refreshToken, expires } = await authService.login(providerName, extract.attributes);

			res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

			return res.redirect(env.PUBLIC_URL);
		}),
		respond
	);

	return router;
}
