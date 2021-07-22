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
	 * @return User id connected to the identifier
	 */
	abstract userID(identifier: string): Promise<string>;

	/**
	 * Verify user password
	 *
	 * @param user User information
	 * @param password User password
	 * @throws InvalidCredentialsException
	 */
	abstract verify(user: User, password?: string): void;

	/**
	 * Handle user session refresh
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	refresh(_user: User): void {
		/* Optional */
	}

	/**
	 * Handle user session termination
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	logout(_user: User): void {
		/* Optional */
	}

	/**
	 * Handle create user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidOperationException
	 */
	createUser(_user: User): void {
		/* Optional */
	}

	/**
	 * Handle update user. Can be used to sync user data with external providers
	 *
	 * Note: Only updated fields are provided
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidOperationException
	 */
	updateUser(_user: User): void {
		/* Optional */
	}

	/**
	 * Handle delete user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidOperationException
	 */
	deleteUser(_user: User): void {
		/* Optional */
	}
}
