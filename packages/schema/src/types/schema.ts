import { SchemaInspector as KnexSchemaInspector } from 'knex-schema-inspector/dist/types/schema-inspector';
import { SchemaOverview } from './overview';

export type SchemaInspector = KnexSchemaInspector & {
	overview: () => Promise<SchemaOverview>;
};
