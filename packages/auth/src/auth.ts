/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User } from './types';

export interface AuthConstructor {
	new (knex: Knex, ...args: any[]): Auth;
}

export default abstract class Auth {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	/**
	 * Get user id by unique identifier
	 *
	 * @param identifier User unique identifier
	 * @throws InvalidCredentialsException
	 * @return User of the unique identifier
	 */
	abstract userID(identifier: string): Promise<string>;

	/**
	 * Verify user secret
	 *
	 * @param user User information
	 * @param secret User secret
	 * @throws InvalidCredentialsException
	 */
	abstract verify(user: User, secret?: string): void;

	/**
	 * Refresh user session
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	refresh(_user: User): void {
		/* Optional */
	}

	/**
	 * Terminate user session
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	logout(_user: User): void {
		/* Optional */
	}

	/**
	 * Handle user secret reset request
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidOperationException
	 */
	requestReset(_user: User): void {
		/* Optional */
	}

	/**
	 * Reset user secret
	 *
	 * @param user User information
	 * @param secret New user secret
	 * @throws InvalidCredentialsException, InvalidOperationException
	 */
	reset(_user: User, _secret?: string): void {
		/* Optional */
	}
}
