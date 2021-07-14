import argon2 from 'argon2';
import { merge } from 'lodash';
import emitter, { emitAsyncSafe } from '../../emitter';
import { InvalidCredentialsException } from '../../exceptions';
import { AuthenticationService, AuthenticatedResponse, AuthenticateOptions } from '../authentication';

interface BasicAuthenticateOptions extends AuthenticateOptions {
	email: string;
	password?: string;
}

export class BasicAuthenticationService extends AuthenticationService {
	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async authenticate(options: BasicAuthenticateOptions): Promise<AuthenticatedResponse> {
		const { email, password } = options;

		let user = await this.knex
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();

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

		if (password !== undefined) {
			if (!user.password) {
				emitStatus('fail');
				throw new InvalidCredentialsException();
			}

			if ((await argon2.verify(user.password, password)) === false) {
				emitStatus('fail');
				throw new InvalidCredentialsException();
			}
		}

		return this.authenticateUser(user, options, emitStatus);
	}

	async verifyPassword(userId: string, password: string): Promise<boolean> {
		const user = await this.knex.select('password').from('directus_users').where({ id: userId }).first();

		if (!user?.password || (await argon2.verify(user.password, password)) === false) {
			throw new InvalidCredentialsException();
		}

		return true;
	}
}
