import { useEnv } from '@directus/env';
import {
	ErrorCode,
	InvalidCredentialsError,
	InvalidPayloadError,
	InvalidProviderConfigError,
	InvalidProviderError,
	ServiceUnavailableError,
	UnexpectedResponseError,
	isDirectusError,
} from '@directus/errors';
import type { Accountability } from '@directus/types';
import { Router } from 'express';
import Joi from 'joi';
import * as ldap from 'ldapts';
import { REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../constants.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { respond } from '../../middleware/respond.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { AuthenticationService } from '../../services/authentication.js';
import { UsersService } from '../../services/users.js';
import type { AuthDriverOptions, AuthenticationMode, User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
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
	bindClient: ldap.Client;
	usersService: UsersService;
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

		this.bindClient = new ldap.Client({
			url: clientUrl,
			...(typeof config['client'] === 'object' ? config['client'] : {}),
		});

		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = config;
	}

	private async validateBindClient(): Promise<void> {
		const logger = useLogger();

		const { bindDn, bindPassword, provider } = this.config;

		try {
			// Bind as the configured service/bind user
			await this.bindClient.bind(bindDn, bindPassword);

			// Healthcheck: make sure the bind DN exists
			const { searchEntries } = await this.bindClient.search(bindDn, {
				scope: 'base',
				attributes: ['dn'],
			});

			if (searchEntries.length === 0) {
				logger.warn('[LDAP] Failed to find bind user record');
				throw new UnexpectedResponseError();
			}
		} catch (err: any) {
			const error = handleError(err);

			if (isDirectusError(error, ErrorCode.InvalidCredentials)) {
				logger.warn('Invalid bind user');
				throw new InvalidProviderConfigError({ provider });
			}

			throw error;
		}
	}

	private async fetchUserInfo(
		baseDn: string,
		filter?: ldap.EqualityFilter,
		scope?: SearchScope,
	): Promise<UserInfo | undefined> {
		let { firstNameAttribute, lastNameAttribute, mailAttribute } = this.config;

		firstNameAttribute ??= 'givenName';
		lastNameAttribute ??= 'sn';
		mailAttribute ??= 'mail';

		try {
			if (!scope || !filter) return undefined;

			const { searchEntries } = await this.bindClient.search(baseDn, {
				filter,
				scope,
				attributes: ['uid', firstNameAttribute, lastNameAttribute, mailAttribute, 'userAccountControl'],
			});

			if (searchEntries.length === 0 || !searchEntries[0]) {
				return undefined;
			}

			const entry = searchEntries[0];

			const user: UserInfo = {
				dn: entry.dn,
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
			throw handleError(err as Error);
		}
	}

	private async fetchUserGroups(baseDn: string, filter?: ldap.EqualityFilter, scope?: SearchScope): Promise<string[]> {
		if (!scope || !filter) {
			return [];
		}

		try {
			const { searchEntries } = await this.bindClient.search(baseDn, {
				filter,
				scope,
				attributes: ['cn'],
			});

			const userGroups: string[] = [];

			for (const entry of searchEntries) {
				const cn = entry['cn'];

				if (Array.isArray(cn)) {
					// cn can be string[] | Buffer[] | mixed
					for (const c of cn) {
						if (Buffer.isBuffer(c)) {
							userGroups.push(c.toString('utf8'));
						} else if (typeof c === 'string') {
							userGroups.push(c);
						}
					}
				} else if (typeof cn === 'string') {
					userGroups.push(cn);
				} else if (Buffer.isBuffer(cn)) {
					userGroups.push(cn.toString('utf8'));
				}
			}

			return userGroups;
		} catch (err) {
			throw handleError(err as Error);
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
			new ldap.EqualityFilter({
				attribute: userAttribute ?? 'cn',
				value: payload['identifier'],
			}),
			userScope ?? 'one',
		);

		if (!userInfo?.dn) {
			throw new InvalidCredentialsError();
		}

		let userRole;

		if (groupDn) {
			const userGroups = await this.fetchUserGroups(
				groupDn,
				new ldap.EqualityFilter({
					attribute: groupAttribute ?? 'member',
					value: groupAttribute?.toLowerCase() === 'memberuid' && userInfo.uid ? userInfo.uid : userInfo.dn,
				}),
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

			const updatedUserPayload = await emitter.emitFilter(
				`auth.update`,
				emitPayload,
				{ identifier: userInfo.dn, provider: this.config['provider'], providerPayload: { userInfo, userRole } },
				{ database: getDatabase(), schema: this.schema, accountability: null },
			);

			// Update user to update properties that might have changed
			await this.usersService.updateOne(userId, updatedUserPayload);

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

		// Run hook so the end user has the chance to augment the
		// user that is about to be created
		const updatedUserPayload = await emitter.emitFilter(
			`auth.create`,
			userPayload,
			{ identifier: userInfo.dn, provider: this.config['provider'], providerPayload: { userInfo, userRole } },
			{ database: getDatabase(), schema: this.schema, accountability: null },
		);

		try {
			await this.usersService.createOne(updatedUserPayload);
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

		const client = new ldap.Client({
			url: this.config['clientUrl'],
			...clientConfig,
		});

		try {
			// Try to bind with the user's DN and password
			await client.bind(user.external_identifier, password);
		} catch (err) {
			throw handleError(err as Error);
		} finally {
			// Always release the connection
			await client.unbind();
		}
	}

	override async login(user: User, payload: Record<string, any>): Promise<void> {
		await this.verify(user, payload['password']);
	}

	override async refresh(user: User): Promise<void> {
		await this.validateBindClient();

		const userInfo = await this.fetchUserInfo(user.external_identifier!);

		if (userInfo?.userAccountControl && userInfo.userAccountControl & INVALID_ACCOUNT_FLAGS) {
			throw new InvalidCredentialsError();
		}
	}
}

const handleError = (e: Error) => {
	if (
		e instanceof ldap.InappropriateAuthError ||
		e instanceof ldap.InvalidCredentialsError ||
		e instanceof ldap.InsufficientAccessError
	) {
		return new InvalidCredentialsError();
	}

	return new ServiceUnavailableError({
		service: 'ldap',
		reason: `Service returned unexpected error: ${e.message}`,
	});
};

const getEntryValue = (value: string | string[] | Buffer | Buffer[] | undefined): string | undefined => {
	if (Array.isArray(value)) {
		const first = value[0];
		if (typeof first === 'string') return first;
		if (Buffer.isBuffer(first)) return first.toString();
		return undefined;
	}

	if (typeof value === 'string') return value;
	if (Buffer.isBuffer(value)) return value.toString();
	return undefined;
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
