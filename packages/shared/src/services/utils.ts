import { Knex } from 'knex';
import { Accountability, PrimaryKey, SchemaOverview } from '../types';
export declare interface UtilsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	sort(
		collection: string,
		{
			item,
			to,
		}: {
			item: PrimaryKey;
			to: PrimaryKey;
		}
	): Promise<void>;
}
