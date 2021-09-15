import { Request } from 'express';
import url from 'url';
import hash from 'object-hash';
import { pick } from 'lodash';

export function getCacheKey(req: Request): string {
	const path = url.parse(req.originalUrl).pathname;
	const isGraphQl = path?.includes('/graphql');

	const info = {
		user: req.accountability?.user || null,
		path,
		query: isGraphQl ? pick(req.query, ['query', 'variables']) : req.sanitizedQuery,
	};

	const key = hash(info);
	return key;
}
