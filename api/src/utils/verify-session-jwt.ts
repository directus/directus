import getDatabase from '../database/index.js';
import { InvalidCredentialsError } from '@directus/errors';
import type { DirectusTokenPayload } from '../types/index.js';

/**
 * Verifies the associated session is still available and valid.
 *
 * @throws If session not found.
 */
export async function verifySessionJWT(payload: DirectusTokenPayload) {
	const database = getDatabase();

	const session = await database
		.select(1)
		.from('directus_sessions')
		.where({
			token: payload['session'],
			user: payload['id'],
		})
		.andWhere('expires', '>=', new Date())
		.first();

	if (!session) {
		throw new InvalidCredentialsError();
	}
}
