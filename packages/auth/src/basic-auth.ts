import argon2 from 'argon2';
import Auth from './auth';
import { User } from './types';
import { InvalidPayloadException } from '@directus/shared/exceptions';
import { InvalidCredentialsException } from './exceptions';

export default class BasicAuth extends Auth {
	/**
	 * Get user id by email
	 */
	async userID(email: string): Promise<string> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		return user.id;
	}

	/**
	 * Verify user password
	 */
	async verify(user: User, password?: string): Promise<void> {
		if (!user.password || !(await argon2.verify(user.password, password as string))) {
			throw new InvalidCredentialsException();
		}
	}

	/**
	 * Handle create user. Can be used to sync user data with external providers
	 */
	createUser(user: User): void {
		if (!user.email) {
			throw new InvalidPayloadException('User requires a valid email.');
		}
	}

	/**
	 * Handle update user. Can be used to sync user data with external providers
	 */
	updateUser(user: Partial<User>): void {
		if (user.email === null) {
			throw new InvalidPayloadException('User email cannot be null.');
		}
	}
}
