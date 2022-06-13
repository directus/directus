import { isEmpty } from 'lodash';
import { PanelQuery } from './types';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';

export function processQuery(stagedQueries: Record<string, any>): string {
	if (!stagedQueries) return '';

	const allQueries: Record<string, any> = {
		query: {},
	};

	for (const [key, query] of Object.entries(stagedQueries)) {
		if (Array.isArray(query.query)) {
			for (let i = 0; i < query.query.length; i++) {
				const oneQuery = query.query[i];
				const panelId = 'id_' + key.replaceAll('-', '_') + '__' + i;

				if (!query?.collection || !oneQuery) continue;

				allQueries.query[panelId] = {};
				allQueries.query[panelId] = formatQuery(oneQuery, query.collection);
			}
		} else {
			const panelId = 'id_' + key.replaceAll('-', '_');

			if (!query?.collection || !query.query) continue;

			allQueries.query[panelId] = formatQuery(query.query, query.collection);
		}
	}

	return jsonToGraphQLQuery(allQueries);
}

function formatQuery(query: PanelQuery, collection: string) {
	const formattedQuery: Record<string, any> = {};

	formattedQuery.__aliasFor = collection;

	if (query?.aggregate && !isEmpty(query.aggregate)) {
		formattedQuery.__aliasFor = collection + '_aggregated';

		for (const [aggregateFunc, field] of Object.entries(query.aggregate)) {
			if (!formattedQuery[aggregateFunc]) {
				formattedQuery[aggregateFunc] = {};
			}
			if (!field) continue;

			formattedQuery[aggregateFunc][field[0]] = true;
		}

		if (query.groupBy) {
			formattedQuery.__args = { groupBy: query.groupBy };
			formattedQuery.group = true;
		}
	}

	if (query.fields) {
		for (const field of query.fields) {
			if (!field) continue;
			const relations = field.split('.');

			if (relations.length > 1) {
				formattedQuery[relations[0]] = formattedQuery[relations[0]] ?? {};

				relationalNesting(formattedQuery[relations[0]], relations);
			} else {
				formattedQuery[field] = true;
			}
		}
	}

	if (query.limit) {
		if (!formattedQuery.__args) {
			formattedQuery.__args = {};
		}
		formattedQuery.__args.limit = query.limit;
	}

	if (query.filter) {
		if (!formattedQuery.__args) {
			formattedQuery.__args = {};
		}
		formattedQuery.__args.filter = query.filter;
	}

	return formattedQuery;
}

function relationalNesting(query: any, relations: string[]) {
	for (let i = 1; i < relations.length; i++) {
		if (i === relations.length - 1) {
			query = query[relations[i]] = true;
		} else {
			query = query[relations[i]] = query[relations[i]] || {};
		}
	}
}
