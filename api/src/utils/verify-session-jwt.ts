import { InvalidCredentialsError } from '@directus/errors';
import getDatabase from '../database/index.js';
import type { DirectusTokenPayload } from '../types/index.js';

/**
 * Verifies the associated session is still available and valid.
 *
 * @returns The oauth_client for the session, or null for regular sessions.
 * @throws If session not found.
 */
export async function verifySessionJWT(payload: DirectusTokenPayload): Promise<{ oauth_client: string | null }> {
	const database = getDatabase();

	const session = await database
		.select('oauth_client')
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

	return { oauth_client: session.oauth_client ?? null };
}
