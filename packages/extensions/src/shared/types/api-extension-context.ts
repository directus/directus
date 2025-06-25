import type { SchemaOverview, ExtensionsServices, Item } from '@directus/types';
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export type ApiExtensionContext<T extends Item = Item, Collection extends string = string> = {
	services: ExtensionsServices<T, Collection>;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { database?: Knex; bypassCache?: boolean }, attempt?: number) => Promise<SchemaOverview>;
};
