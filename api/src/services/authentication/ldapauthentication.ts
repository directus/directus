import ldap, {
	Client,
	ClientOptions,
	Error,
	SearchCallbackResponse,
	SearchEntry,
	InvalidCredentialsError,
	InsufficientAccessRightsError,
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

export class LDAPAuthenticationService extends AuthenticationService {
	/**
	 * Bind LDAP user to active session.
	 */
	private bind(client: Client, userDN: string, password?: string): Promise<void> {
		return new Promise((resolve, reject) => {
			client.bind(userDN, password as string, (err: Error | null) => {
				if (err) {
					client.unbind();
					return reject(err);
				}
				resolve();
			});
		});
	}

	/**
	 * Fetch LDAP user info.
	 */
	private fetchUserInfo(client: Client, userDN: string): Promise<{ firstName?: string; lastName?: string }> {
		return new Promise((resolve, reject) => {
			client.search(userDN, { attributes: ['givenName', 'sn'] }, (err: Error | null, res: SearchCallbackResponse) => {
				if (err) {
					return reject(err);
				}

				res.on('searchEntry', ({ object }: SearchEntry) => {
					resolve({
						firstName: object?.givenName as string,
						lastName: object?.sn as string,
					});
				});

				res.on('error', (err: Error | null) => {
					reject(err);
				});

				res.on('end', () => {
					reject();
				});
			});
		});
	}

	async getUser(userDN: string): Promise<any> {
		return this.knex
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['user_dn', userDN.toLowerCase()])
			.first();
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
			if (err instanceof InsufficientAccessRightsError) {
				throw new ForbiddenException();
			}
			throw err;
		}

		/**
		 * If user not mapped in Directus create new user.
		 */
		if (!user) {
			const itemsService = new ItemsService('directus_users', {
				knex: this.knex,
				schema: this.schema,
			});

			try {
				const { firstName, lastName } = await this.fetchUserInfo(ldapClient, userDN);
				await itemsService.createOne({
					user_dn: userDN,
					first_name: firstName,
					last_name: lastName,
				});
			} catch (err) {
				emitStatus('fail');
				if (err instanceof InsufficientAccessRightsError) {
					throw new ForbiddenException();
				}
				throw err;
			}

			user = await this.getUser(userDN);
		}

		ldapClient.destroy();

		return this.authenticateUser(user, options, emitStatus);
	}

	async verifyPassword(): Promise<boolean> {
		return true;
	}
}
