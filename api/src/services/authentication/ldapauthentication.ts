import ldap, {
	Client,
	ClientOptions,
	Error,
	SearchCallbackResponse,
	SearchEntry,
	InvalidCredentialsError,
} from 'ldapjs';
import { merge } from 'lodash';
import emitter, { emitAsyncSafe } from '../../emitter';
import { InvalidCredentialsException, ForbiddenException } from '../../exceptions';
import { AuthenticationService, AuthenticateOptions, AuthenticatedResponse } from '../authentication';
import { ItemsService } from '../items';
import { getConfigFromEnv } from '../../utils/get-config-from-env';
import env from '../../env';

interface LDAPAuthenticateOptions extends AuthenticateOptions {
	userCN: string;
	password?: string;
}

interface UserInfo {
	firstName?: string;
	lastName?: string;
	email?: string;
}

const generateUserGroupFilter = (groupClass: string, groupAttribute: string, userDN: string) =>
	`(&(objectClass=${groupClass})(${groupAttribute}=${userDN}))`;

export class LDAPAuthenticationService extends AuthenticationService {
	/**
	 * Bind LDAP user to active session.
	 */
	private bind(ldapClient: Client, userDN: string, password?: string): Promise<void> {
		return new Promise((resolve, reject) => {
			ldapClient.bind(userDN, password as string, (err: Error | null) => {
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
	private fetchUserInfo(ldapClient: Client, userDN: string): Promise<UserInfo> {
		return new Promise((resolve, reject) => {
			ldapClient.search(
				userDN,
				{ attributes: ['givenName', 'sn', 'mail'] },
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						return reject(err);
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						resolve({
							firstName: (object.givenName as string) || undefined,
							lastName: (object.sn as string) || undefined,
							email: (object.mail as string) || undefined,
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
	 * Fetch user groups.
	 */
	private fetchUserGroups(ldapClient: Client, userDN: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const userGroups: string[] = [];

			ldapClient.search(
				env.LDAP_GROUP_DN,
				{
					attributes: ['cn'],
					filter: generateUserGroupFilter(env.LDAP_GROUP_CLASS, env.LDAP_GROUP_ATTRIBUTE, userDN),
					scope: 'one',
				},
				(err: Error | null, res: SearchCallbackResponse) => {
					if (err) {
						return reject(err);
					}

					res.on('searchEntry', ({ object }: SearchEntry) => {
						userGroups.push(object.cn as string);
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
		const ldapClient = ldap.createClient(
			getConfigFromEnv('LDAP_', [
				'LDAP_USER_DN',
				'LDAP_GROUP_DN',
				'LDAP_GROUP_CLASS',
				'LDAP_GROUP_ATTRIBUTE',
			]) as ClientOptions
		);
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
			await this.bind(ldapClient, userDN, options.password);
		} catch (err) {
			emitStatus('fail');
			if (err instanceof InvalidCredentialsError) {
				throw new InvalidCredentialsException();
			}
			throw err;
		}

		/**
		 * Register user information.
		 */
		const itemsService = new ItemsService('directus_users', {
			knex: this.knex,
			schema: this.schema,
		});

		if (!user) {
			try {
				const { firstName, lastName, email } = await this.fetchUserInfo(ldapClient, userDN);
				await itemsService.createOne({
					user_dn: userDN.toLowerCase(),
					first_name: firstName,
					last_name: lastName,
					email,
				});
			} catch (err) {
				emitStatus('fail');
				throw err;
			}

			user = await this.getUser(userDN);
		}

		if (user) {
			const userGroups = await this.fetchUserGroups(ldapClient, userDN);
			const userRole = await this.getUserRole(userGroups);

			itemsService.updateOne(user.id, {
				role: userRole,
			});
		}

		ldapClient.destroy();

		return this.authenticateUser(user, options, emitStatus);
	}

	async verifyPassword(): Promise<boolean> {
		return true;
	}
}
