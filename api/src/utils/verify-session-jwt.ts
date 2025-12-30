import getDatabase from '../database/index.js';
import type { DirectusTokenPayload } from '../types/index.js';
import { InvalidCredentialsError } from '@directus/errors';

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
			user: payload['id'] || null,
			share: payload['share'] || null,
		})
		.andWhere('expires', '>=', new Date())
		.first();

	if (!session) {
		throw new InvalidCredentialsError();
	}
}
