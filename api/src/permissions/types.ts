import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export interface Context {
	schema: SchemaOverview;
	knex: Knex;
}
