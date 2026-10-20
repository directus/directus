import { useEnv } from '@directus/env';
import { GraphQLSchema } from 'graphql';
import { LRUMap } from 'mnemonist';
import { useBus } from '../../bus/index.js';

const env = useEnv();
const bus = useBus();

/** Mirrors the `GRAPHQL_SCHEMA_CACHE_CAPACITY` default */
const DEFAULT_CACHE_CAPACITY = 100;

export const cache = new LRUMap<string, GraphQLSchema | string>(
	env.GRAPHQL_SCHEMA_CACHE_CAPACITY ?? DEFAULT_CACHE_CAPACITY,
);

bus.subscribe('schemaChanged', () => {
	cache.clear();
});
