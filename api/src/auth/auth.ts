/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User, Session } from '../types';

export abstract class AuthDriver {
	knex: Knex;

	constructor(knex: Knex, _config: Record<string, any>) {
		this.knex = knex;
	}

	/**
	 * Get user id for a given provider payload
	 *
	 * @param payload Any data that the user might've provided
	 * @throws InvalidCredentialsException
	 * @return User id of the identifier
	 */
	abstract getUserID(identifier: string | number, payload: Record<string, any>): Promise<string>;

	/**
	 * Verify user password
	 *
	 * @param user User information
	 * @param password User password
	 * @throws InvalidCredentialsException
	 */
	abstract verify(user: User, password?: string): void;

	/**
	 * Check with the (external) provider if the user is allowed entry to Directus
	 *
	 * @param _user User information
	 * @param _payload Any data that the user might've provided
	 * @throws InvalidCredentialsException
	 */
	async login(_user: User, _payload: Record<string, any>): Promise<Record<string, any> | null> {
		/* Optional, though should probably be set */
		return null;
	}

	/**
	 * Handle user session refresh
	 *
	 * @param user User information
	 * @param session Session data
	 * @throws InvalidCredentialsException
	 */
	async refresh(_user: User, _session: Session): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle user session termination
	 *
	 * @param user User information
	 * @param session Session data
	 * @throws InvalidCredentialsException
	 */
	async logout(_user: User, _session: Session): Promise<void> {
		/* Optional */
	}
}
