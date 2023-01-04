import { Request } from 'express';
import hash from 'object-hash';
import url from 'url';
import { getGraphqlQueryAndVariables } from './get-graphql-query-and-variables';

export function getCacheKey(req: Request): string {
	const path = url.parse(req.originalUrl).pathname;
	const isGraphQl = path?.startsWith('/graphql');

	const info = {
		user: req.accountability?.user || null,
		path,
		query: isGraphQl ? getGraphqlQueryAndVariables(req) : req.sanitizedQuery,
	};

	const key = hash(info);
	return key;
}
