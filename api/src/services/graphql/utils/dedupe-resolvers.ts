import type { GraphQLParams } from '@directus/types';
import type { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { print } from 'graphql';
import hash from 'object-hash';

/**
 * Builds a stable deduplication key for a GraphQL resolver call by combining
 * the field name, a hash of its arguments, and the printed selection set.
 * Used to identify structurally identical resolver invocations within a request.
 */
export function resolverCacheKey(args: Record<string, unknown>, info: GraphQLResolveInfo): string {
	const selectionKey = info.fieldNodes[0]?.selectionSet ? print(info.fieldNodes[0].selectionSet) : '';
	const cacheKey = `${info.fieldName}:${hash(args ?? {})}:${selectionKey}`;
	return cacheKey;
}

/**
 * Wraps a GraphQL field resolver to deduplicate concurrent calls with identical
 * inputs within a single request. The first call stores the Promise in the
 * request-scoped `context.cache`; subsequent identical calls return the same
 * Promise, preventing redundant async work.
 *
 * @param resolver - The async resolver to wrap.
 * @param overrideKey - Optional fixed key, bypassing the auto-generated key.
 */
export function dedupeResolver<TSource, TArgs extends Record<string, unknown>>(
	resolver: GraphQLFieldResolver<TSource, GraphQLParams['contextValue'], TArgs, Promise<unknown>>,
	overrideKey?: string,
): GraphQLFieldResolver<TSource, GraphQLParams['contextValue'], TArgs> {
	return (source, args, context, info) => {
		const { cache } = context;
		const cacheKey = overrideKey ?? resolverCacheKey(args, info);

		if (!cache.has(cacheKey)) {
			cache.set(cacheKey, resolver(source, args, context, info));
		}

		return cache.get(cacheKey);
	};
}

type GCResolverParams<TSource, TArgs> = {
	source: TSource;
	args: TArgs;
	context: GraphQLParams['contextValue'];
	info: GraphQLResolveInfo;
};

type GCResolver<TSource, TArgs> = (rp: GCResolverParams<TSource, TArgs>) => Promise<unknown>;

/**
 * Like `dedupeResolver`, but for relational resolvers using the GraphQL Compose
 * resolver param convention `{ source, args, context, info }`.
 *
 * Additionally writes the resolved value to `context.data` after resolution,
 * which is required as a workaround for many-to-any (m2a) type handling.
 *
 * @param resolver - The async relational resolver to wrap.
 */
export function dedupeRelationalResolver<TSource, TArgs extends Record<string, unknown>>(
	resolver: GCResolver<TSource, TArgs>,
): GCResolver<TSource, TArgs> {
	return async ({ source, args, context, info }) => {
		const { cache } = context;
		const cacheKey = resolverCacheKey(args, info);

		if (!cache.has(cacheKey)) {
			cache.set(cacheKey, resolver({ source, args, context, info }));
		}

		const result = await cache.get(cacheKey);
		context.data = result;
		return result;
	};
}
