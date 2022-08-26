import * as validator from '@authenio/samlify-node-xmllint';
import express, { Router } from 'express';
import * as samlify from 'samlify';

import { getAuthProvider } from '../../auth';
import { COOKIE_OPTIONS } from '../../constants';
import env from '../../env';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials';
import { respond } from '../../middleware/respond';
import { AuthenticationService } from '../../services/authentication';
import { AuthDriverOptions, User } from '../../types';
import asyncHandler from '../../utils/async-handler';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import { LocalAuthDriver } from './local';

samlify.setSchemaValidator(validator);

export class SAMLAuthDriver extends LocalAuthDriver {
	idp: any;
	sp: any;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		this.config = config;
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
		const { provider, emailKey, identifierKey } = this.config;
		const email = payload[emailKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
		const identifier = payload[identifierKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
		const userID = await this.fetchUserID(identifier);
		if (userID) return userID;
		throw new InvalidCredentialsException();
	}

	async login(user: User) {

	}
}

export function createSAMLAuthRouter(providerName: string) {
	const router = Router();

	router.get('/metadata', asyncHandler(async (req, res, next) => {
		const { sp } = getAuthProvider(providerName) as SAMLAuthDriver;
		return res.header('Content-Type', 'text/xml').send(sp.getMetadata());
	}));

	router.get('/', asyncHandler(async (req, res) => {
		const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
		const { context } = await sp.createLoginRequest(idp, 'redirect');
		return res.redirect(context);
	}));

	router.post('/acs', express.urlencoded({ extended: false }), asyncHandler(async (req, res, next) => {
		const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
		const { extract } = await sp.parseLoginResponse(idp, 'post', req);
		const authService = new AuthenticationService({ accountability: req.accountability, schema: req.schema });
		const { accessToken, refreshToken, expires } = await authService.login(providerName, extract.attributes);

		res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

		return res.redirect(env.PUBLIC_URL);
	}), respond);

	return router;
}
