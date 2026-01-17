import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	InvalidProviderError,
	isDirectusError,
	ServiceUnavailableError,
	UnexpectedResponseError,
} from '@directus/errors';
import type { Accountability } from '@directus/types';
import { Router } from 'express';
import Joi from 'joi';
import type { Entry } from 'ldapts';
import {
	Client,
	InappropriateAuthError,
	InsufficientAccessError,
	InvalidCredentialsError as LdapInvalidCredentialsError,
} from 'ldapts';
import { REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../constants.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { respond } from '../../middleware/respond.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { AuthenticationService } from '../../services/authentication.js';
import type { AuthDriverOptions, AuthenticationMode, User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getSchema } from '../../utils/get-schema.js';
import { AuthDriver } from '../auth.js';

interface UserInfo {
	dn: string;
	uid?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	userAccountControl: number;
}

type SearchScope = 'base' | 'one' | 'sub';

// 0x2: ACCOUNTDISABLE
// 0x10: LOCKOUT
// 0x800000: PASSWORD_EXPIRED
const INVALID_ACCOUNT_FLAGS = 0x800012;

export class LDAPAuthDriver extends AuthDriver {
	bindClient: Client;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const logger = useLogger();

		const { bindDn, bindPassword, userDn, provider, clientUrl } = config;

		if (
			bindDn === undefined ||
			bindPassword === undefined ||
			!userDn ||
			!provider ||
			(!clientUrl && !config['client']?.socketPath)
		) {
			logger.error('Invalid provider config');
			throw new InvalidProviderConfigError({ provider });
		}

		const clientConfig = typeof config['client'] === 'object' ? config['client'] : {};

		this.bindClient = new Client({
			url: clientUrl,
			...clientConfig,
		});

		this.config = config;
	}

	private async validateBindClient(): Promise<void> {
		const logger = useLogger();

		const { bindDn, bindPassword, provider } = this.config;

		try {
			// Attempt to bind with the configured credentials
			await this.bindClient.bind(bindDn, bindPassword);

			// Healthcheck: verify bind user can read their own DN
			const { searchEntries } = await this.bindClient.search(bindDn, {
				scope: 'base',
			});

			if (searchEntries.length === 0) {
				logger.warn('[LDAP] Failed to find bind user record');
				throw new UnexpectedResponseError();
			}
		} catch (err) {
			const error = handleError(err);

			if (isDirectusError(error, ErrorCode.InvalidCredentials)) {
				logger.warn('Invalid bind user');
				throw new InvalidProviderConfigError({ provider });
			}

			throw error;
		}
	}

	private async fetchUserInfo(baseDn: string, filter?: string, scope?: SearchScope): Promise<UserInfo | undefined> {
		let { firstNameAttribute, lastNameAttribute, mailAttribute } = this.config;

		firstNameAttribute ??= 'givenName';
		lastNameAttribute ??= 'sn';
		mailAttribute ??= 'mail';

		try {
			const searchOptions: { attributes: string[]; filter?: string; scope?: SearchScope } = {
				attributes: ['uid', firstNameAttribute, lastNameAttribute, mailAttribute, 'userAccountControl'],
			};

			if (filter !== undefined) searchOptions.filter = filter;
			if (scope !== undefined) searchOptions.scope = scope;

			const { searchEntries } = await this.bindClient.search(baseDn, searchOptions);

			if (searchEntries.length === 0) {
				return undefined;
			}

			const entry = searchEntries[0] as Entry;

			const user: UserInfo = {
				dn: entry['dn'],
				userAccountControl: Number(getEntryValue(entry['userAccountControl']) ?? 0),
			};

			const firstName = getEntryValue(entry[firstNameAttribute]);
			if (firstName) user.firstName = firstName;

			const lastName = getEntryValue(entry[lastNameAttribute]);
			if (lastName) user.lastName = lastName;

			const email = getEntryValue(entry[mailAttribute]);
			if (email) user.email = email;

			const uid = getEntryValue(entry['uid']);
			if (uid) user.uid = uid;

			return user;
		} catch (err) {
			throw handleError(err);
		}
	}

	private async fetchUserGroups(baseDn: string, filter?: string, scope?: SearchScope): Promise<string[]> {
		try {
			const searchOptions: { attributes: string[]; filter?: string; scope?: SearchScope } = {
				attributes: ['cn'],
			};

			if (filter !== undefined) searchOptions.filter = filter;
			if (scope !== undefined) searchOptions.scope = scope;

			const { searchEntries } = await this.bindClient.search(baseDn, searchOptions);

			const userGroups: string[] = [];

			for (const entry of searchEntries) {
				const cn = entry['cn'];

				if (Array.isArray(cn)) {
					userGroups.push(...cn.map((v) => String(v)));
				} else if (cn) {
					userGroups.push(String(cn));
				}
			}

			return userGroups;
		} catch (err) {
			throw handleError(err);
		}
	}

	private async fetchUserId(userDn: string): Promise<string | undefined> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.orWhereRaw('LOWER(??) = ?', ['external_identifier', userDn.toLowerCase()])
			.first();

		return user?.id;
	}

	async getUserID(payload: Record<string, any>): Promise<string> {
		if (!payload['identifier']) {
			throw new InvalidCredentialsError();
		}

		const logger = useLogger();

		await this.validateBindClient();

		const { userDn, userScope, userAttribute, groupDn, groupScope, groupAttribute, defaultRoleId, syncUserInfo } =
			this.config;

		const userInfo = await this.fetchUserInfo(
			userDn,
			`(${validateLDAPAttribute(userAttribute ?? 'cn')}=${escapeFilterValue(payload['identifier'])})`,
			userScope ?? 'one',
		);

		if (!userInfo?.dn) {
			throw new InvalidCredentialsError();
		}

		let userRole;

		if (groupDn) {
			const groupAttr = groupAttribute ?? 'member';
			const memberValue = groupAttr.toLowerCase() === 'memberuid' && userInfo.uid ? userInfo.uid : userInfo.dn;

			const userGroups = await this.fetchUserGroups(
				groupDn,
				`(${validateLDAPAttribute(groupAttr)}=${escapeFilterValue(memberValue)})`,
				groupScope ?? 'one',
			);

			if (userGroups.length) {
				userRole = await this.knex
					.select('id')
					.from('directus_roles')
					.whereRaw(`LOWER(??) IN (${userGroups.map(() => '?')})`, [
						'name',
						...userGroups.map((group) => group.toLowerCase()),
					])
					.first();
			}
		}

		const userId = await this.fetchUserId(userInfo.dn);

		if (userId) {
			// Run hook so the end user has the chance to augment the
			// user that is about to be updated
			let emitPayload = {};

			// Only sync roles if the AD groups are configured
			if (groupDn) {
				emitPayload = {
					role: userRole?.id ?? defaultRoleId ?? null,
				};
			}

			if (syncUserInfo) {
				emitPayload = {
					...emitPayload,
					first_name: userInfo.firstName,
					last_name: userInfo.lastName,
					email: userInfo.email,
				};
			}

			const schema = await getSchema();

			const updatedUserPayload = await emitter.emitFilter(
				`auth.update`,
				emitPayload,
				{ identifier: userInfo.dn, provider: this.config['provider'], providerPayload: { userInfo, userRole } },
				{ database: getDatabase(), schema, accountability: null },
			);

			// Update user to update properties that might have changed
			const usersService = this.getUsersService(schema);
			await usersService.updateOne(userId, updatedUserPayload);

			return userId;
		}

		if (!userInfo) {
			throw new InvalidCredentialsError();
		}

		const userPayload = {
			provider: this.config['provider'],
			first_name: userInfo.firstName,
			last_name: userInfo.lastName,
			email: userInfo.email,
			external_identifier: userInfo.dn,
			role: userRole?.id ?? defaultRoleId,
		};

		const schema = await getSchema();

		// Run hook so the end user has the chance to augment the
		// user that is about to be created
		const updatedUserPayload = await emitter.emitFilter(
			`auth.create`,
			userPayload,
			{ identifier: userInfo.dn, provider: this.config['provider'], providerPayload: { userInfo, userRole } },
			{ database: getDatabase(), schema, accountability: null },
		);

		try {
			const usersService = this.getUsersService(schema);
			await usersService.createOne(updatedUserPayload);
		} catch (e) {
			if (isDirectusError(e, ErrorCode.RecordNotUnique)) {
				logger.warn(e, '[LDAP] Failed to register user. User not unique');
				throw new InvalidProviderError();
			}

			throw e;
		}

		return (await this.fetchUserId(userInfo.dn)) as string;
	}

	async verify(user: User, password?: string): Promise<void> {
		if (!user.external_identifier || !password) {
			throw new InvalidCredentialsError();
		}

		const clientConfig = typeof this.config['client'] === 'object' ? this.config['client'] : {};

		const client = new Client({
			url: this.config['clientUrl'],
			...clientConfig,
		});

		try {
			await client.bind(user.external_identifier, password);
		} catch (err) {
			throw handleError(err);
		} finally {
			await client.unbind().catch(() => {
				// Ignore unbind errors
			});
		}
	}

	override async login(user: User, payload: Record<string, any>): Promise<void> {
		await this.verify(user, payload['password']);
	}

	override async refresh(user: User): Promise<void> {
		await this.validateBindClient();

		// Use scope 'base' to search the specific DN entry
		const userInfo = await this.fetchUserInfo(user.external_identifier!, undefined, 'base');

		if (userInfo?.userAccountControl && userInfo.userAccountControl & INVALID_ACCOUNT_FLAGS) {
			throw new InvalidCredentialsError();
		}
	}
}

const handleError = (e: unknown): Error => {
	if (
		e instanceof InappropriateAuthError ||
		e instanceof LdapInvalidCredentialsError ||
		e instanceof InsufficientAccessError
	) {
		return new InvalidCredentialsError();
	}

	if (e instanceof Error) {
		return new ServiceUnavailableError({
			service: 'ldap',
			reason: `Service returned unexpected error: ${e.message}`,
		});
	}

	return new ServiceUnavailableError({
		service: 'ldap',
		reason: 'Service returned unexpected error',
	});
};

const getEntryValue = (value: string | string[] | Buffer | Buffer[] | undefined): string | undefined => {
	if (value === undefined) return undefined;

	if (Buffer.isBuffer(value)) {
		return value.toString();
	}

	if (Array.isArray(value)) {
		const first = value[0];

		if (Buffer.isBuffer(first)) {
			return first.toString();
		}

		return first;
	}

	return value;
};

/**
 * Escape special characters in LDAP filter values according to RFC 4515
 */
const escapeFilterValue = (value: string): string => {
	return value
		.replace(/\\/g, '\\5c')
		.replace(/\*/g, '\\2a')
		.replace(/\(/g, '\\28')
		.replace(/\)/g, '\\29')
		.replace(/\0/g, '\\00');
};

/**
 * Validate LDAP attribute name according to RFC 4512
 */
const validateLDAPAttribute = (name: string): string => {
	if (/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name) === false) {
		throw new Error(`Invalid LDAP attribute name: "${name}"`);
	}

	return name;
};

export function createLDAPAuthRouter(provider: string): Router {
	const router = Router();

	const loginSchema = Joi.object({
		identifier: Joi.string().required(),
		password: Joi.string().required(),
		mode: Joi.string().valid('cookie', 'json', 'session'),
		otp: Joi.string(),
	}).unknown();

	router.post(
		'/',
		asyncHandler(async (req, res, next) => {
			const env = useEnv();

			const accountability: Accountability = createDefaultAccountability({
				ip: getIPFromReq(req),
			});

			const userAgent = req.get('user-agent')?.substring(0, 1024);
			if (userAgent) accountability.userAgent = userAgent;

			const origin = req.get('origin');
			if (origin) accountability.origin = origin;

			const authenticationService = new AuthenticationService({
				accountability: accountability,
				schema: req.schema,
			});

			const { error } = loginSchema.validate(req.body);

			if (error) {
				throw new InvalidPayloadError({ reason: error.message });
			}

			const mode: AuthenticationMode = req.body.mode ?? 'json';

			const { accessToken, refreshToken, expires } = await authenticationService.login(provider, req.body, {
				session: mode === 'session',
				otp: req.body?.otp,
			});

			const payload = { access_token: accessToken, expires } as {
				access_token: string;
				expires: number;
				refresh_token?: string;
			};

			if (mode === 'json') {
				payload.refresh_token = refreshToken;
			}

			if (mode === 'cookie') {
				res.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
			}

			if (mode === 'session') {
				res.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
			}

			res.locals['payload'] = { data: payload };

			return next();
		}),
		respond,
	);

	return router;
}
