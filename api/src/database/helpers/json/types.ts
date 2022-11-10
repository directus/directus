import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
import { Item, SchemaOverview } from '@directus/shared/types';
import { JsonFieldNode } from '../../../types';

export abstract class JsonHelper extends DatabaseHelper {
	constructor(protected knex: Knex, protected schema: SchemaOverview, protected nodes: JsonFieldNode[] = []) {
		super(knex);
		this.schema = schema;
		this.nodes = nodes;
	}
	static isSupported(_version: string, _full = ''): boolean {
		return false;
	}

	abstract preProcess(dbQuery: Knex.QueryBuilder, table: string): void;
	abstract postProcess(items: Item[]): void;
}
