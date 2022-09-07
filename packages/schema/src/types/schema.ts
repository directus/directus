import type { SchemaInspector as KnexSchemaInspector } from 'knex-schema-inspector/dist/types/schema-inspector';
import type { SchemaOverview } from './overview.js';

export type SchemaInspector = KnexSchemaInspector & {
	overview: () => Promise<SchemaOverview>;
};
