import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
import { Item, SchemaOverview } from '@directus/shared/types';
import { JsonFieldNode } from '../../../types';

export abstract class JsonHelper extends DatabaseHelper {
	constructor(protected knex: Knex, protected schema: SchemaOverview, public nodes: JsonFieldNode[] = []) {
		super(knex);
		this.schema = schema;
		this.nodes = nodes;
	}

	abstract preProcess(dbQuery: Knex.QueryBuilder, table: string): void;
	abstract postProcess(items: Item[]): void;
	abstract filterQuery(collection: string, node: JsonFieldNode): Knex.Raw | null;
}
