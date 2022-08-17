import { useFieldsStore } from '@/stores/fields';
import { Query } from '@directus/shared/types';
import { toArray } from '@directus/shared/utils';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { isEmpty, pick, set, omitBy, isUndefined } from 'lodash';

type QueryInfo = { collection: string; key: string; query: Query };

export function queryToGqlString(queries: QueryInfo | QueryInfo[]): string | null {
	if (!queries || isEmpty(queries)) return null;

	const queryJSON: Record<string, any> = {
		query: {},
	};

	for (const query of toArray(queries)) {
		queryJSON.query[query.key] = formatQuery(query);
	}

	return jsonToGraphQLQuery(queryJSON);
}

export function formatQuery({ collection, query }: QueryInfo): Record<string, any> {
	const queryKeysInArguments: (keyof Query)[] = ['limit', 'sort', 'filter', 'offset', 'page', 'search'];

	const alias = collection.startsWith('directus_') ? collection.substring(9) : collection;

	const formattedQuery: Record<string, any> = {
		__args: omitBy(pick(query, ...queryKeysInArguments), isUndefined),
		__aliasFor: alias,
	};

	const fields = query.fields ?? [useFieldsStore().getPrimaryKeyFieldForCollection(collection)!.field];

	if (query?.aggregate && !isEmpty(query.aggregate)) {
		formattedQuery.__aliasFor = alias + '_aggregated';

		for (const [aggregateFunc, fields] of Object.entries(query.aggregate)) {
			if (!formattedQuery[aggregateFunc]) {
				formattedQuery[aggregateFunc] = {};
			}

			fields.forEach((field) => {
				formattedQuery[aggregateFunc][field] = true;
			});
		}

		if (query.group) {
			formattedQuery.group = true;
			formattedQuery.__args.groupBy = query.group;
		}
	} else {
		for (const field of fields) {
			set(formattedQuery, field, true);
		}
	}

	if (query.deep) {
		// TBD @TODO
	}

	if (query.filter) {
		try {
			const json = String(query.filter);
			formattedQuery.__args.filter = JSON.parse(json);
		} catch {
			// Keep current value there
		}
	}

	return formattedQuery;
}
