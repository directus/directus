import url from 'url';
import { toArray } from '@directus/utils';
import { ipInNetworks } from '@directus/utils/node';
import { version } from 'directus/version';
import type { Request } from 'express';
import { isEmpty, pick } from 'lodash-es';
import hash from 'object-hash';
import getDatabase from '../database/index.js';
import { getFlowManager } from '../flows.js';
import { fetchPoliciesIpAccess } from '../permissions/modules/fetch-policies-ip-access/fetch-policies-ip-access.js';
import { getGraphqlQueryAndVariables } from './get-graphql-query-and-variables.js';

// Match /flows/trigger/<uuid> and extract the UUID
const FLOW_TRIGGER_PATTERN = /^\/flows\/trigger\/([0-9a-f-]+)/i;

export async function getCacheKey(req: Request) {
	const path = url.parse(req.originalUrl).pathname;
	const isGraphQl = path?.startsWith('/graphql');

	let flowTriggerQuery: Record<string, any> | undefined = undefined;

	if (path) {
		const flowMatch = path.match(FLOW_TRIGGER_PATTERN);

		// Flow trigger endpoints accept arbitrary query params that affect their response,
		// but these are not captured in sanitizedQuery.

		if (flowMatch) {
			const flow = getFlowManager().getFlow(flowMatch[1]!);
			const cacheQueryParams: string[] = toArray(flow?.options?.['cacheQueryParams'] ?? []);
			const picked = pick(req.query, cacheQueryParams);

			if (!isEmpty(picked)) flowTriggerQuery = picked;
		}
	}

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
		...(flowTriggerQuery && { rawQuery: flowTriggerQuery }),
		...(includeIp && { ip: req.accountability!.ip }),
	};

	const key = hash(info);
	return key;
}
