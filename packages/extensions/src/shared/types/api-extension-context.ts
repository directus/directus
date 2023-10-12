import type { Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export type ApiExtensionContext = {
	services: any;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { accountability?: Accountability; database?: Knex }) => Promise<SchemaOverview>;
};
