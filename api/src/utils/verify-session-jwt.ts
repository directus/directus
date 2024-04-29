import getDatabase from "../database";
import { InvalidTokenError } from '@directus/errors';
import type { DirectusTokenPayload } from "../types";

export async function verifySessionJWT(payload: DirectusTokenPayload) {
	const database = getDatabase();

	const session = await database
		.select('token', 'user', 'expires', 'ip')
		.from('directus_sessions')
		.where({
			'token': payload['session'],
			'user': payload['id'],
		})
		.andWhere('expires', '>=', new Date())
		.first();

	if (!session) {
		throw new InvalidTokenError();
	}
}
