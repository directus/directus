import type { Env } from '@directus/env';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { SchemaOverview } from '../schema.js';
import type { ExtensionsServices } from '../services.js';

export type ApiExtensionContext = {
	services: ExtensionsServices;
	database: Knex;
	env: Env;
	logger: Logger;
	getSchema: (options?: { database?: Knex; bypassCache?: boolean }, attempt?: number) => Promise<SchemaOverview>;
};
