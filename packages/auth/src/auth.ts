/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User } from './types';

export interface AuthConstructor {
	/**
	 * Auth constructor
	 *
	 * @param knex Database driver
	 * @param provider Auth provider name
	 * @param args Optional config args
	 */
	new (knex: Knex, provider: string, ...args: any[]): Auth;
}

export default abstract class Auth {
	knex: Knex;
	provider: string;

	constructor(knex: Knex, provider: string) {
		this.knex = knex;
		this.provider = provider;
	}

	/**
	 * Get user id by unique identifier
	 *
	 * @param identifier Unique user identifier
	 * @throws InvalidCredentialsException
	 * @return User id of the identifier
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
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	createUser(_user: Partial<User>): void {
		/* Optional */
	}

	/**
	 * Handle update user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	updateUser(_user: Partial<User>): void {
		/* Optional */
	}

	/**
	 * Handle delete user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	deleteUser(_user: User): void {
		/* Optional */
	}
}
