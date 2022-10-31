import * as validator from '@authenio/samlify-node-xmllint';
import express, { Router } from 'express';
import { parseJSON } from '@directus/shared/utils';
import * as samlify from 'samlify';
import logger from '../../logger';
import { getAuthProvider } from '../../auth';
import { COOKIE_OPTIONS } from '../../constants';
import env from '../../env';
import Joi from 'joi';
import { parse as toXML } from 'js2xmlparser';
import { RecordNotUniqueException } from '../../exceptions/database/record-not-unique';
import { InvalidConfigException, InvalidCredentialsException, InvalidProviderException } from '../../exceptions';
import { respond } from '../../middleware/respond';
import { AuthenticationService, UsersService } from '../../services';
import { AuthData, AuthDriverOptions, User } from '../../types';
import asyncHandler from '../../utils/async-handler';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import { LocalAuthDriver } from './local';
import { Url } from '../../utils/url';

// tell samlify to use validator...
samlify.setSchemaValidator(validator);

export class SAMLAuthDriver extends LocalAuthDriver {
	idp: any;
	sp: any;
	redirectUrl: string;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		this.config = config;
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });

		const redirectUrl = new Url(env.PUBLIC_URL).addPath('auth', 'login', config.provider, 'callback');
		this.redirectUrl = redirectUrl.toString();

		if (this.validateMetadata()) {
			this.sp = samlify.ServiceProvider(getConfigFromEnv(`AUTH_${config.provider.toUpperCase()}_SP`));
			this.idp = samlify.IdentityProvider(getConfigFromEnv(`AUTH_${config.provider.toUpperCase()}_IDP`));
		}
	}

	// validate if metadata looks correct, first making sure it's not empty then validating it's what we expect...
	validateMetadata() {
		const samlSchema = Joi.object({
			sp: Joi.string()
				.pattern(/(<.[^(><.)]+>)/)
				.required(),
			idp: Joi.string()
				.pattern(/(<.[^(><.)]+>)/)
				.required(),
			registration: Joi.bool(),
			defaultRoleId: Joi.alternatives().conditional('registration', {
				is: true,
				then: Joi.string().required(),
				otherwise: Joi.string(),
			}),
		}).unknown();

		// validate if the metadata field of each key contains valid xml...
		const { error } = samlSchema.validate({
			sp: getConfigFromEnv(`AUTH_${this.config.provider.toUpperCase()}_SP`).metadata,
			idp: getConfigFromEnv(`AUTH_${this.config.provider.toUpperCase()}_IDP`).metadata,
			registration: this.config.allowPublicRegistration,
			defaultRoleId: this.config.defaultRoleId,
		});

		if (error) {
			throw new InvalidConfigException(error.message);
		}

		const spString = toXML(
			'SPSSODescriptor',
			getConfigFromEnv(`AUTH_${this.config.provider.toUpperCase()}_SP`).metadata
		);
		const idpString = toXML(
			'IDPSSODescriptor',
			getConfigFromEnv(`AUTH_${this.config.provider.toUpperCase()}_SP`).metadata
		);

		if (!spString || !idpString) {
			throw new InvalidConfigException('[SAML] config error: invalid xml');
		}

		return true;
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
		const { provider, emailKey, identifierKey, nameKey, givenNameKey, familyNameKey, allowPublicRegistration } =
			this.config;

		const email = payload[emailKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
		const identifier = payload[identifierKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
		const userID = await this.fetchUserID(identifier);

		const userInfo = {
			name: payload[nameKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
			given_name: payload[givenNameKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
			family_name: payload[familyNameKey ?? 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'],
			email,
		};

		if (userID) return userID;

		// Is public registration allowed?
		if (!allowPublicRegistration) {
			logger.trace(`[SAML] User doesn't exist, and public registration not allowed for provider "${provider}"`);
			throw new InvalidCredentialsException();
		}

		try {
			await this.usersService.createOne({
				provider,
				first_name: userInfo.given_name,
				last_name: userInfo.family_name,
				email: email,
				external_identifier: identifier.toLowerCase(),
				role: this.config.defaultRoleId,
			});
			const userID = await this.fetchUserID(identifier);
			if (userID) return userID;
		} catch (e) {
			if (e instanceof RecordNotUniqueException) {
				logger.warn(e, '[SAML] Failed to register user. User not unique');
				throw new InvalidProviderException();
			}
			throw e;
		}

		throw new InvalidCredentialsException();
	}

	async login(user: User): Promise<void> {
		let authData = user.auth_data as AuthData;

		if (typeof authData === 'string') {
			try {
				authData = parseJSON(authData);
			} catch {
				logger.warn(`[SAML] Session data isn't valid JSON: ${authData}`);
			}
		}
	}
}

export function createSAMLAuthRouter(providerName: string) {
	const router = Router();

	router.get(
		'/metadata',
		asyncHandler(async (req, res) => {
			const { sp } = getAuthProvider(providerName) as SAMLAuthDriver;
			return res.header('Content-Type', 'text/xml').send(sp.getMetadata());
		})
	);

	router.get(
		'/',
		asyncHandler(async (req, res) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { context: url } = await sp.createLoginRequest(idp, 'redirect');
			const parsedUrl = new URL(url);
			if (req.query.redirect) {
				parsedUrl.searchParams.append('RelayState', req.query.redirect as string);
			}
			return res.redirect(parsedUrl.toString());
		})
	);

	router.post(
		'/logout',
		asyncHandler(async (req, res) => {
			const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
			const { context } = await sp.createLogoutRequest(idp, 'redirect', req.body);
			return res.redirect(context);
		})
	);

	router.post(
		'/acs',
		express.urlencoded({ extended: false }),
		asyncHandler(async (req, res, next) => {
			try {
				const { sp, idp } = getAuthProvider(providerName) as SAMLAuthDriver;
				const { extract } = await sp.parseLoginResponse(idp, 'post', req);

				const authService = new AuthenticationService({ accountability: req.accountability, schema: req.schema });
				const { accessToken, refreshToken, expires } = await authService.login(providerName, extract.attributes);

				const relayState: string | undefined = req.body?.RelayState;

				res.locals.payload = {
					data: {
						access_token: accessToken,
						refresh_token: refreshToken,
						expires,
					},
				};

				if (relayState) {
					res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
					return res.redirect(relayState);
				}
				next();
			} catch (error: any) {
				logger.warn(error, `[SAML] Unexpected error during SAML login`);
				throw error;
			}
		}),
		respond
	);

	return router;
}
