import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../types';

export abstract class JsonHelper extends DatabaseHelper {
	supported(): boolean | Promise<boolean> {
		return true;
	}
	abstract jsonQuery(table: string, query: Knex.QueryBuilder, fields: JsonFieldNode[]): Knex.QueryBuilder;
	abstract jsonColumn(table: string, column: string, path: string, alias: string): Knex.Raw;
}
