import type { SchemaInspector as KnexSchemaInspector } from '../lib/types/schema-inspector';
import type { SchemaOverview } from './overview.js';

export type SchemaInspector = KnexSchemaInspector & {
	overview: () => Promise<SchemaOverview>;
};
