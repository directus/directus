import { useEnv } from '@directus/env';
import { GraphQLSchema } from 'graphql';
import { LRUMap } from 'mnemonist';
import { useBus } from '../../bus/index.js';

const env = useEnv();
const bus = useBus();

export const cache = new LRUMap<string, GraphQLSchema | string>(Number(env['GRAPHQL_SCHEMA_CACHE_CAPACITY'] ?? 100));

// The per-role/user GraphQL schemas are built from permissions data, so they must be
// invalidated on both structural schema changes AND permission/policy/access changes.
bus.subscribe('schemaChanged', () => {
	cache.clear();
});

bus.subscribe('permissionsChanged', () => {
	cache.clear();
});
