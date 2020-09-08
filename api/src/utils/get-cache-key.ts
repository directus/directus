import { Request } from "express";

export function getCacheKey(req: Request) {
	const key = `${req.accountability?.user || 'null'}-${req.originalUrl}-${JSON.stringify(req.sanitizedQuery)}`;
	return key;
}
