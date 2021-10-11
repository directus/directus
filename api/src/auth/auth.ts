/* eslint-disable @typescript-eslint/no-empty-function */

import { Knex } from 'knex';
import { User, SessionData } from '../types';

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
	abstract getUserID(payload: Record<string, any>): Promise<string>;

	/**
	 * Verify user password
	 *
	 * @param user User information
	 * @param password User password
	 * @throws InvalidCredentialsException
	 */
	abstract verify(user: User, password?: string): Promise<void>;

	/**
	 * Check with the (external) provider if the user is allowed entry to Directus
	 *
	 * @param _user User information
	 * @param _payload Any data that the user might've provided
	 * @throws InvalidCredentialsException
	 * @returns Data to be stored with the session
	 */
	async login(_user: User, _payload: Record<string, any>): Promise<SessionData> {
		/* Optional, though should probably be set */
		return null;
	}

	/**
	 * Handle user session refresh
	 *
	 * @param _user User information
	 * @param _sessionData Session data
	 * @throws InvalidCredentialsException
	 */
	async refresh(_user: User, _sessionData: SessionData): Promise<void> {
		/* Optional */
	}

	/**
	 * Handle user session termination
	 *
	 * @param _user User information
	 * @param _sessionData Session data
	 */
	async logout(_user: User, _sessionData: SessionData): Promise<void> {
		/* Optional */
	}
}
