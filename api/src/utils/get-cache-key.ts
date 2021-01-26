import { Request } from 'express';
import url from 'url';

export function getCacheKey(req: Request) {
	const path = url.parse(req.originalUrl).pathname;
	const key = `${req.accountability?.user || 'null'}-${path}-${JSON.stringify(req.sanitizedQuery)}`;
	return key;
}
