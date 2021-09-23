/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User } from '../types';

export abstract class AuthDriver {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
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
	abstract verify(user: User, password?: string): Promise<void>;

	/**
	 * Handle user session refresh
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	async refresh(_user: User, _sessionData: Record<string, any> | null): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle user session termination
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException
	 */
	async logout(_user: User, _sessionData: Record<string, any> | null): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle create user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	async createUser(_user: Partial<User>): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle update user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	async updateUser(_user: Partial<User>): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle delete user. Can be used to sync user data with external providers
	 *
	 * @param user User information
	 * @throws InvalidCredentialsException, InvalidPayloadException
	 */
	async deleteUser(_user: User): Promise<void> {
		/* Optional */
	}
}
