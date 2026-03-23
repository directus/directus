import url from 'url';
import { ipInNetworks } from '@directus/utils/node';
import { version } from 'directus/version';
import type { Request } from 'express';
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

	let flowTriggerQuery: Record<string, any> | undefined;

	if (path) {
		const flowMatch = path.match(FLOW_TRIGGER_PATTERN);

		if (flowMatch) {
			const flowId = flowMatch[1]!;
			const flowOptions = getFlowManager().getWebhookFlowOptions(flowId);
			const cacheQueryParams: string[] | undefined = flowOptions?.['cacheQueryParams'];

			if (req.query && Object.keys(req.query).length > 0) {
				if (cacheQueryParams && cacheQueryParams.length > 0) {
					// Only include the admin-configured query params in the cache key
					const filtered: Record<string, any> = {};

					for (const param of cacheQueryParams) {
						if (param in req.query) {
							filtered[param] = req.query[param];
						}
					}

					if (Object.keys(filtered).length > 0) {
						flowTriggerQuery = filtered;
					}
				} else {
					// No allowlist configured — include all query params (default behavior)
					flowTriggerQuery = req.query as Record<string, any>;
				}
			}
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
		// Flow trigger endpoints accept arbitrary query params that affect their response,
		// but these are not captured in sanitizedQuery. When cacheQueryParams is configured,
		// only the specified params are included; otherwise all query params are included.
		...(flowTriggerQuery && { rawQuery: flowTriggerQuery }),
		...(includeIp && { ip: req.accountability!.ip }),
	};

	const key = hash(info);
	return key;
}
