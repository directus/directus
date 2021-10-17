import { Router } from 'express';
import ldap, { Client, Error, SearchCallbackResponse, SearchEntry } from 'ldapjs';
import ms from 'ms';
import Joi from 'joi';
import { AuthDriver } from '../auth';
import { AuthDriverOptions, User, SessionData } from '../../types';
import {
	InvalidCredentialsException,
	InvalidPayloadException,
	ServiceUnavailableException,
	InvalidConfigException,
} from '../../exceptions';
import { AuthenticationService, UsersService } from '../../services';
import asyncHandler from '../../utils/async-handler';
import env from '../../env';
import { respond } from '../../middleware/respond';

interface UserInfo {
	firstName?: string;
	lastName?: string;
	email?: string;
}

export class LDAPAuthDriver extends AuthDriver {
	bindClient: Promise<Client>;
	usersService: UsersService;
	config: Record<string, any>;

	constructor(options: AuthDriverOptions, config: Record<string, any>) {
		super(options, config);

		const { bindDn, bindPassword, ...additionalConfig } = config;

		if (
			!bindDn ||
			!bindPassword ||
			!additionalConfig.userDn ||
			(!additionalConfig.clientUrl && !additionalConfig.client?.socketPath)
		) {
			throw new InvalidConfigException('Invalid provider config', { provider: additionalConfig.provider });
		}

		this.bindClient = new Promise((resolve, reject) => {
			const clientConfig = additionalConfig.client?.length ? additionalConfig.client : {};
			const client = ldap.createClient({ url: additionalConfig.clientUrl, reconnect: true, ...clientConfig });

			client.on('error', (err: Error) => {
				reject(
					new ServiceUnavailableException('Service returned unexpected error', {
						service: 'ldap',
						message: err.message,
					})
				);
			});

			client.bind(bindDn, bindPassword, (err: Error | null) => {
				if (err) {
					reject(new InvalidCredentialsException());
					return;
				}
				resolve(client);
			});
		});
		this.usersService = new UsersService({ knex: this.knex, schema: this.schema });
		this.config = additionalConfig;
	}

	private async fetchUserDn(identifier: string): Promise<string | undefined> {
		const { userDn, userAttribute } = this.config;
		const client = await this.bindClient;

		return new Promise((resolve, reject) => {
			// Search for the user in LDAP by attribute
			client.search(
				userDn,
				{
					attributes: ['cn'],
					filter: `(${userAttribute ?? 'cn'}=${identifier})`,
					scope: 'one',
				},
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						reject(
							new ServiceUnavailableException('Failed to fetch userDn', {
								service: 'ldap',
								message: err.message,
							})
						);
						return;
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						const userCn = typeof object.cn === 'object' ? object.cn[0] : object.cn;
						resolve(`cn=${userCn},${userDn}`.toLowerCase());
					});

					res.on('error', (err: Error) => {
						reject(
							new ServiceUnavailableException('Failed to fetch userDn', {
								service: 'ldap',
								message: err.message,
							})
						);
					});

					res.on('end', () => {
						resolve(undefined);
					});
				}
			);
		});
	}

	private async fetchUserInfo(userDn: string): Promise<UserInfo | undefined> {
		const client = await this.bindClient;

		return new Promise((resolve, reject) => {
			// Fetch user info in LDAP by domain component
			client.search(
				userDn,
				{ attributes: ['givenName', 'sn', 'mail'] },
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						reject(
							new ServiceUnavailableException('Failed to fetch user info', {
								service: 'ldap',
								message: err.message,
							})
						);
						return;
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						resolve({
							firstName: typeof object.givenName === 'object' ? object.givenName[0] : object.givenName,
							lastName: typeof object.sn === 'object' ? object.sn[0] : object.sn,
							email: typeof object.mail === 'object' ? object.mail[0] : object.mail,
						});
					});

					res.on('error', (err: Error) => {
						reject(
							new ServiceUnavailableException('Failed to fetch user info', {
								service: 'ldap',
								message: err.message,
							})
						);
					});

					res.on('end', () => {
						resolve(undefined);
					});
				}
			);
		});
	}

	private async fetchUserGroups(userDn: string): Promise<string[]> {
		const { groupDn, groupAttribute } = this.config;

		if (!groupDn) {
			return Promise.resolve([]);
		}

		const client = await this.bindClient;

		return new Promise((resolve, reject) => {
			let userGroups: string[] = [];

			// Search for the user info in LDAP by group attribute
			client.search(
				groupDn,
				{
					attributes: ['cn'],
					filter: `(${groupAttribute}=${userDn})`,
					scope: 'one',
				},
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						reject(
							new ServiceUnavailableException('Failed to fetch user groups', {
								service: 'ldap',
								message: err.message,
							})
						);
						return;
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						if (typeof object.cn === 'object') {
							userGroups = [...userGroups, ...object.cn];
						} else if (object.cn) {
							userGroups.push(object.cn);
						}
					});

					res.on('error', (err: Error) => {
						reject(
							new ServiceUnavailableException('Failed to fetch user groups', {
								service: 'ldap',
								message: err.message,
							})
						);
					});

					res.on('end', () => {
						resolve(userGroups);
					});
				}
			);
		});
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
		if (!payload.identifier || !payload.password) {
			throw new InvalidCredentialsException();
		}

		const userDn = await this.fetchUserDn(payload.identifier);

		if (!userDn) {
			throw new InvalidCredentialsException();
		}

		const userId = await this.fetchUserId(userDn);

		if (userId) {
			return userId;
		}

		const userInfo = await this.fetchUserInfo(userDn);
		const userGroups = await this.fetchUserGroups(userDn);
		let userRole;

		if (!userInfo) {
			throw new InvalidCredentialsException();
		}

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

		await this.usersService.createOne({
			provider: this.config.provider,
			first_name: userInfo.firstName,
			last_name: userInfo.lastName,
			email: userInfo.email,
			external_identifier: userDn,
			role: userRole?.id,
		});

		return (await this.fetchUserId(userDn)) as string;
	}

	async verify(user: User, password?: string): Promise<void> {
		if (!user.external_identifier || !password) {
			throw new InvalidCredentialsException();
		}

		return new Promise((resolve, reject) => {
			const clientConfig = this.config.client?.length ? this.config.client : {};
			const client = ldap.createClient({
				url: this.config.clientUrl,
				...clientConfig,
				reconnect: false,
			});

			client.on('error', (err: Error) => {
				reject(
					new ServiceUnavailableException('Service returned unexpected error', {
						service: 'ldap',
						message: err.message,
					})
				);
			});

			client.bind(user.external_identifier!, password, (err: Error | null) => {
				client.destroy();
				if (err) {
					reject(new InvalidCredentialsException());
					return;
				}
				resolve();
			});
		});
	}

	async login(user: User, payload: Record<string, any>): Promise<SessionData> {
		await this.verify(user, payload.password);
		return null;
	}
}

export function createLDAPAuthRouter(provider: string): Router {
	const router = Router();

	const loginSchema = Joi.object({
		identifier: Joi.string().required(),
		password: Joi.string().required(),
		mode: Joi.string().valid('cookie', 'json'),
		otp: Joi.string(),
	}).unknown();

	router.post(
		'/',
		asyncHandler(async (req, res, next) => {
			const accountability = {
				ip: req.ip,
				userAgent: req.get('user-agent'),
				role: null,
			};

			const authenticationService = new AuthenticationService({
				accountability: accountability,
				schema: req.schema,
			});

			const { error } = loginSchema.validate(req.body);

			if (error) {
				throw new InvalidPayloadException(error.message);
			}

			const mode = req.body.mode || 'json';

			const { accessToken, refreshToken, expires } = await authenticationService.login(
				provider,
				req.body,
				req.body?.otp
			);

			const payload = {
				data: { access_token: accessToken, expires },
			} as Record<string, Record<string, any>>;

			if (mode === 'json') {
				payload.data.refresh_token = refreshToken;
			}

			if (mode === 'cookie') {
				res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
					httpOnly: true,
					domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
					maxAge: ms(env.REFRESH_TOKEN_TTL as string),
					secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
					sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
				});
			}

			res.locals.payload = payload;

			return next();
		}),
		respond
	);

	return router;
}
