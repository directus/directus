/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User, Session } from '../types';

export abstract class AuthDriver {
	knex: Knex;

	constructor(knex: Knex, _config: Record<string, any>) {
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
	abstract verify(user: User, password?: string): void;

	/**
	 * Handle user session refresh
	 *
	 * @param user User information
	 * @param session Session data
	 * @throws InvalidCredentialsException
	 */
	refresh(_user: User, _session: Session): void {
		/* Optional */
	}

	/**
	 * Handle user session termination
	 *
	 * @param user User information
	 * @param session Session data
	 * @throws InvalidCredentialsException
	 */
	logout(_user: User, _session: Session): void {
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
