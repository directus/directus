import api from '@/api';
import { isNil } from 'lodash';
import { processQuery } from './process-query';

export async function queryCaller(
	request: string,
	callAttempts: number,
	queryObj: Record<string, any>,
	system?: boolean,
	reattempt?: boolean
) {
	if (request === 'query' || request === '') return;

	try {
		let response;

		if (system) {
			response = await api.post('/graphql/system', {
				query: request,
			});
		} else {
			response = await api.post('/graphql', {
				query: request,
			});
		}

		return response.data.data;
	} catch (errs: any) {
		callAttempts++;
		if (reattempt && callAttempts >= 10) {
			callAttempts = 0;
			return errs;
			// figure out how to load the unerrored panels...
		}
		if (!errs.response?.data.errors) return;

		errorHandler(errs.response.data.errors, queryObj);

		const request = processQuery(queryObj);
		queryCaller(request, callAttempts, queryObj);
	}
}

function errorHandler(errs: any, queryObj: Record<string, any>) {
	const queriesToRemove: Record<string, any> = {};

	for (const error of errs) {
		if (isNil(error.extensions.graphqlErrors[0].message)) continue;

		const message = error.extensions.graphqlErrors[0].message;

		if (message && message.includes('_aggregated')) {
			const collection = message.match(/"([^ ]*?)_aggregated/)[1];
			const field = message.match(/"(.*?)"/)[1];

			queriesToRemove[collection] = { field, aggregate: true };
		} else if (message && message.includes('_filter')) {
			const collection = message.match(/"([^ ]*?)_filter/)[1];
			const field = message.match(/"([^ ]*?)"/)[1];

			queriesToRemove[collection] = { field, filter: true };
		} else if (message) {
			const fields = message.match(/"(.*?)"/g);

			const collection = fields[1].match(/"(.*?)"/)[1];
			const field = fields[0].match(/"(.*?)"/)[1];

			queriesToRemove[collection] = { field };
		}
	}

	for (const [key, query] of Object.entries(queryObj)) {
		const match = queriesToRemove[query?.collection];
		if (!match) continue;

		if (match.aggregate && query.query.aggregate && JSON.stringify(query.query.aggregate).includes(match.field)) {
			delete queryObj[key];
		} else if (match.filter && query.query.filter && JSON.stringify(query.query.filter).includes(match.field)) {
			delete queryObj[key];
		} else if (query.query?.fields && query.query.fields.includes(match.field)) {
			delete queryObj[key];
		}
	}
}
