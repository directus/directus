import type { SchemaOverview } from '../schema.js';
import type { ExtensionsServices } from '../services.js';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export type ApiExtensionContext = {
	services: ExtensionsServices;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { database?: Knex; bypassCache?: boolean }, attempt?: number) => Promise<SchemaOverview>;
};
