import { useEnv } from '@directus/env';
import { GraphQLSchema } from 'graphql';
import { LRUMap } from 'mnemonist';
import { useBus } from '../../bus/index.js';

const env = useEnv();
const bus = useBus();

export const cache = new LRUMap<string, GraphQLSchema | string>(Number(env['GRAPHQL_SCHEMA_CACHE_CAPACITY'] ?? 100));

bus.subscribe('schemaChanged', () => {
	cache.clear();
});
