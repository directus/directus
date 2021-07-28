import { Request } from 'express';
import url from 'url';
import hash from 'object-hash';

export function getCacheKey(req: Request): string {
	const path = url.parse(req.originalUrl).pathname;

	const info = {
		user: req.accountability?.user || null,
		path,
		query: path?.includes('/graphql') ? req.sanitizedQuery : req.params.query,
	};

	const key = hash(info);

	return key;
}
