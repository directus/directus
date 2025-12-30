import { getHelpers } from '../../helpers/index.js';
import type { Knex } from 'knex';

export function withPreprocessBindings(knex: Knex, dbQuery: Knex.QueryBuilder) {
	const schemaHelper = getHelpers(knex).schema;

	dbQuery.client = new Proxy(dbQuery.client, {
		get(target, prop, receiver) {
			if (prop === 'query') {
				return (connection: Knex, queryParams: Knex.Sql) =>
					Reflect.get(target, prop, receiver).bind(dbQuery.client)(
						connection,
						schemaHelper.prepQueryParams(queryParams),
					);
			}

			if (prop === 'prepBindings') {
				return (bindings: Knex.Value[]) =>
					schemaHelper.prepBindings(Reflect.get(target, prop, receiver).bind(dbQuery.client)(bindings));
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}
