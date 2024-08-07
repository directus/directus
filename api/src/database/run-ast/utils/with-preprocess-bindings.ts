import type { Knex } from 'knex';
import { getHelpers } from '../../helpers/index.js';

export function withPreprocessBindings(knex: Knex, dbQuery: Knex.QueryBuilder) {
	const schemaHelper = getHelpers(knex).schema;

	dbQuery.client = new Proxy(dbQuery.client, {
		get(target, prop, receiver) {
			if (prop === 'query') {
				return (connection: any, queryParam: any) => {
					return Reflect.get(target, prop, receiver).bind(target)(
						connection,
						schemaHelper.preprocessBindings(queryParam),
					);
				};
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}
