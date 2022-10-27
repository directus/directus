import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
// import { JsonFieldNode } from '../../../types';

const JSON_FEATURES = ['JSON_QUERYING', 'JSON_WILDCARDS', 'JSON_FILTERING'] as const;
type SupportedJsonFeature = typeof JSON_FEATURES[number];

export abstract class JsonHelper extends DatabaseHelper {
	async supported(): Promise<SupportedJsonFeature[]> {
		return ['JSON_QUERYING'];
	}
	// abstract jsonQuery(table: string, query: Knex.QueryBuilder, fields: JsonFieldNode[]): Knex.QueryBuilder;
	abstract jsonColumn(table: string, column: string, path: string, alias: string): Knex.Raw;
}
