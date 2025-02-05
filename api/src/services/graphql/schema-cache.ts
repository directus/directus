import { useEnv } from '@directus/env';
import type { SchemaOverview } from '@directus/types';
import { GraphQLSchema } from 'graphql';
import LRUMapDefault from 'mnemonist/lru-map.js';
import { useBus } from '../../bus/index.js';

// Workaround for misaligned types in mnemonist package exports
const LRUMap = LRUMapDefault as unknown as typeof LRUMapDefault.default;

const env = useEnv();
const bus = useBus();

export const cache: {
	gqlSchema: LRUMapDefault.default<string, string | GraphQLSchema>;
	globalSanitizedSchema: SchemaOverview | null;
} = {
	gqlSchema: new LRUMap<string, GraphQLSchema | string>(Number(env['GRAPHQL_SCHEMA_CACHE_CAPACITY'] ?? 100)),
	globalSanitizedSchema: null,
};

bus.subscribe('schemaChanged', () => {
	cache.gqlSchema.clear();
	cache.globalSanitizedSchema = null;
});
