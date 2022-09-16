import { Knex } from 'knex';
import { Accountability, Query, SchemaOverview } from '../types';
export declare interface MetaService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	getMetaForQuery(collection: string, query: any): Promise<Record<string, any> | undefined>;
	totalCount(collection: string): Promise<number>;
	filterCount(collection: string, query: Query): Promise<number>;
}
