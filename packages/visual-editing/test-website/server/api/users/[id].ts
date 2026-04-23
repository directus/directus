import { defineEventHandler, getRouterParam, createError } from 'h3';
import { directusServer, readUser } from '../../utils/directus-server';

export default defineEventHandler(async (event) => {
	const authorId = getRouterParam(event, 'id');

	if (!authorId) {
		throw createError({ statusCode: 400, message: 'Missing author ID' });
	}

	try {
		const author = await directusServer.request(
			readUser(authorId, {
				fields: ['first_name', 'last_name', 'avatar'],
			}),
		);

		if (!author) {
			throw createError({ statusCode: 404, message: `Author not found: ${authorId}` });
		}

		return author;
	} catch {
		throw createError({ statusCode: 500, message: `Failed to fetch author: ${authorId}` });
	}
});
