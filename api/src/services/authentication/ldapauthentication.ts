import ldap, {
	Client,
	ClientOptions,
	Error,
	SearchCallbackResponse,
	SearchEntry,
	InvalidCredentialsError,
} from 'ldapjs';
import { merge } from 'lodash';
import { AuthenticationService, AuthenticateOptions, AuthenticatedResponse } from '../authentication';
import { ItemsService } from '../items';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import emitter, { emitAsyncSafe } from '../../emitter';
import { InvalidCredentialsException, ForbiddenException } from '../../exceptions';
import { AbstractServiceOptions } from '../../types';
import logger from '../../logger';
import env from '../../env';

interface LDAPAuthenticateOptions extends AuthenticateOptions {
	userCN: string;
	password: string;
}

interface UserInfo {
	firstName?: string;
	lastName?: string;
	email?: string;
}

/**
 * TODO: Add unbind before throw.
 */
export class LDAPAuthenticationService extends AuthenticationService {
	client: Client;

	constructor(options: AbstractServiceOptions) {
		super(options);

		this.client = ldap.createClient(
			getConfigFromEnv('LDAP_', [
				'LDAP_USER_DN',
				'LDAP_GROUP_DN',
				'LDAP_GROUP_CLASS',
				'LDAP_GROUP_ATTRIBUTE',
			]) as ClientOptions
		);
	}

	/**
	 * Bind LDAP user to active session.
	 */
	private bind(userDN: string, password: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.client.bind(userDN, password, (err: Error | null) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}

	/**
	 * Fetch LDAP user info.
	 */
	private fetchUserInfo(userDN: string): Promise<UserInfo> {
		return new Promise((resolve, reject) => {
			this.client.search(
				userDN,
				{ attributes: ['givenName', 'sn', 'mail'] },
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						return reject(err);
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						resolve({
							firstName: typeof object.givenName === 'string' ? object.givenName : undefined,
							lastName: typeof object.sn === 'string' ? object.sn : undefined,
							email: typeof object.mail === 'string' ? object.mail : undefined,
						});
					});

					res.on('error', (err: Error | null) => {
						reject(err);
					});

					res.on('end', () => {
						reject();
					});
				}
			);
		});
	}

	/**
	 * Fetch LDAP user groups.
	 */
	private fetchUserGroups(userDN: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			let userGroups: string[] = [];

			this.client.search(
				env.LDAP_GROUP_DN,
				{
					attributes: ['cn'],
					filter: `(&(objectClass=${env.LDAP_GROUP_CLASS})(${env.LDAP_GROUP_ATTRIBUTE}=${userDN}))`,
					scope: 'one',
				},
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						return reject(err);
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						if (typeof object.cn === 'object') {
							userGroups = [...userGroups, ...object.cn];
						} else {
							userGroups.push(object.cn);
						}
					});

					res.on('error', (err: Error | null) => {
						reject(err);
					});

					res.on('end', () => {
						resolve(userGroups.filter((cn) => cn));
					});
				}
			);
		});
	}

	async getUser(userDN: string): Promise<any> {
		return this.knex
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['user_dn', userDN.toLowerCase()])
			.first();
	}

	async getUserRole(userGroups: string[]): Promise<any> {
		if (userGroups.length) {
			return this.knex
				.select('id')
				.from('directus_roles')
				.whereRaw(`LOWER(??) IN (${userGroups.map(() => '?')})`, [
					'name',
					...userGroups.map((groupName) => groupName.toLowerCase()),
				])
				.first();
		}
	}

	async authenticate(options: LDAPAuthenticateOptions): Promise<AuthenticatedResponse> {
		const userDN = `cn=${options.userCN},${env.LDAP_USER_DN}`;
		let user = await this.getUser(userDN);

		const updatedUser = await emitter.emitAsync('auth.login.before', options, {
			event: 'auth.login.before',
			action: 'login',
			schema: this.schema,
			payload: options,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
			database: this.knex,
		});

		if (updatedUser) {
			user = updatedUser.length > 0 ? updatedUser.reduce((val, acc) => merge(acc, val)) : user;
		}

		const emitStatus = (status: 'fail' | 'success') => {
			emitAsyncSafe('auth.login', options, {
				event: 'auth.login',
				action: 'login',
				schema: this.schema,
				payload: options,
				accountability: this.accountability,
				status,
				user: user?.id,
				database: this.knex,
			});
		};

		/**
		 * Authenticate user.
		 */
		try {
			await this.bind(userDN, options.password);
		} catch (err) {
			if (err instanceof InvalidCredentialsError) {
				emitStatus('fail');
				throw new InvalidCredentialsException();
			}
			throw err;
		}

		/**
		 * Update user information.
		 */
		const itemsService = new ItemsService('directus_users', {
			knex: this.knex,
			schema: this.schema,
		});

		if (!user) {
			const { firstName, lastName, email } = await this.fetchUserInfo(userDN);

			await itemsService.createOne({
				user_dn: userDN.toLowerCase(),
				first_name: firstName,
				last_name: lastName,
				email,
			});

			user = await this.getUser(userDN);
		}

		if (user) {
			try {
				const userGroups = await this.fetchUserGroups(userDN);
				const userRole = (await this.getUserRole(userGroups)) ?? null;

				await itemsService.updateOne(user.id, { role: userRole });
			} catch (err) {
				logger.warn(`Fetching role for user "${userDN}" failed unexpectedly.`);
				await itemsService.updateOne(user.id, { role: null });
			}
		}

		this.client.unbind();

		return this.authenticateUser(user, options, emitStatus);
	}

	async verifyPassword(userId: string, password: string): Promise<boolean> {
		const user = await this.knex.select('user_dn').from('directus_users').where({ id: userId }).first();

		if (!user?.user_dn) {
			throw new InvalidCredentialsException();
		}

		try {
			await this.bind(user.user_dn, password);
		} catch (err) {
			if (err instanceof InvalidCredentialsError) {
				throw new InvalidCredentialsException();
			}
			throw err;
		}

		this.client.unbind();

		return true;
	}
}
