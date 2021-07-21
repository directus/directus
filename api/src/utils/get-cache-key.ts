import { Request } from 'express';
import url from 'url';

export function getCacheKey(req: Request): string {
	const path = url.parse(req.originalUrl).pathname;

	let key: string;

	if (path?.includes('/graphql')) {
		key = `${req.accountability?.user || 'null'}-${path}-${JSON.stringify(req.params.query)}`;
	} else {
		key = `${req.accountability?.user || 'null'}-${path}-${JSON.stringify(req.sanitizedQuery)}`;
	}

	return key;
}
