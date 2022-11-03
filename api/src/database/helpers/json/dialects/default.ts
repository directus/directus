import { Item } from '@directus/shared/types';
import { parseJSON } from '@directus/shared/utils';
import { Knex } from 'knex';
import { JsonHelper } from '../types';

/**
 * The default handler only passes the data to the Knex jsonExtract function
 */
export class JsonHelperDefault extends JsonHelper {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.queryPath, node.fieldKey, false));
			})
		);
	}
	applyJoins(dbQuery: Knex.QueryBuilder): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		// empty stub
		return dbQuery;
	}
	applyQuery(dbQuery: Knex.QueryBuilder): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		// empty stub
		return dbQuery;
	}
	postProcess(items: Item[]): void {
		if (this.nodes.length === 0) return;
		const keys = this.nodes.map(({ fieldKey }) => fieldKey);
		for (const item of items) {
			for (const jsonAlias of keys) {
				if (jsonAlias in item && typeof item[jsonAlias] === 'string') {
					try {
						item[jsonAlias] = parseJSON(item[jsonAlias]);
					} catch {
						// in case a single string value was returned
					}
				}
			}
		}
	}
}
