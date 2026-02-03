import url from 'url';
import { ipInNetworks } from '@directus/utils/node';
import { version } from 'directus/version';
import type { Request } from 'express';
import hash from 'object-hash';
import getDatabase from '../database/index.js';
import { fetchPoliciesIpAccess } from '../permissions/modules/fetch-policies-ip-access/fetch-policies-ip-access.js';
import { getGraphqlQueryAndVariables } from './get-graphql-query-and-variables.js';

export async function getCacheKey(req: Request) {
	const path = url.parse(req.originalUrl).pathname;
	const isGraphQl = path?.startsWith('/graphql');

	let includeIp = false;

	if (req.accountability && req.accountability.ip) {
		// Check if the IP influences the result of the request, that can be the case if some policies have an ip_access
		// filter and the request IP matches any of those filters
		const ipFilters = await fetchPoliciesIpAccess(req.accountability, getDatabase());
		includeIp = ipFilters.length > 0 && ipFilters.some((networks) => ipInNetworks(req.accountability!.ip!, networks));
	}

	const info = {
		version,
		user: req.accountability?.user || null,
		path,
		query: isGraphQl ? getGraphqlQueryAndVariables(req) : req.sanitizedQuery,
		...(includeIp && { ip: req.accountability!.ip }),
	};

	const key = hash(info);
	return key;
}
