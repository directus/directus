import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export interface Context {
	schema: SchemaOverview;
	knex: Knex;
	accountability?: Accountability;
}
