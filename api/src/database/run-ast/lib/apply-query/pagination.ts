import type { Knex } from 'knex';
import { getHelpers } from '../../../helpers/index.js';

export function applyLimit(knex: Knex, rootQuery: Knex.QueryBuilder, limit: any) {
	if (typeof limit === 'number') {
		getHelpers(knex).schema.applyLimit(rootQuery, limit);
	}
}

export function applyOffset(knex: Knex, rootQuery: Knex.QueryBuilder, offset: any) {
	if (typeof offset === 'number') {
		getHelpers(knex).schema.applyOffset(rootQuery, offset);
	}
}
