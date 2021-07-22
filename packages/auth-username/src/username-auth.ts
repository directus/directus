import { BasicAuth, InvalidCredentialsException } from '@directus/auth';

export default class UsernameAuth extends BasicAuth {
	/**
	 * Get user id by username or email
	 */
	async userID(username: string): Promise<string> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['identifier', username.toLowerCase()])
			.orWhereRaw('LOWER(??) = ?', ['email', username.toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		return user.id;
	}

	/**
	 * Handle create user. Can be used to sync user data with external providers
	 */
	createUser(): void {
		/* Allow null email unlike parent */
	}

	/**
	 * Handle update user. Can be used to sync user data with external providers
	 */
	updateUser(): void {
		/* Allow null email unlike parent */
	}
}
