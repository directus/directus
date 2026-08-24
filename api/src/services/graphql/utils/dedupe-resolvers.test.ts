import type { GraphQLParams } from '@directus/types';
import type { GraphQLResolveInfo } from 'graphql';
import { parse } from 'graphql';
import { describe, expect, test, vi } from 'vitest';
import { dedupeRelationalResolver, dedupeResolver, resolverCacheKey } from './dedupe-resolvers.js';

/** Builds a minimal GraphQLResolveInfo with a field name and optional selection set. */
function makeInfo(fieldName: string, selectionSetSource?: string): GraphQLResolveInfo {
	const source = selectionSetSource ? `{ ${fieldName} ${selectionSetSource} }` : `{ ${fieldName} }`;
	const fieldNode = (parse(source).definitions[0] as any).selectionSet.selections[0];
	return { fieldName, fieldNodes: [fieldNode] } as unknown as GraphQLResolveInfo;
}

/** Creates a fresh request-scoped context with an empty cache. */
function makeContext(): GraphQLParams['contextValue'] {
	return { cache: new Map() } as unknown as GraphQLParams['contextValue'];
}

describe('resolverCacheKey', () => {
	test('returns a string combining field name, arg hash, and selection key', () => {
		const info = makeInfo('myField', '{ id name }');
		const key = resolverCacheKey({ id: 1 }, info);
		expect(key).toMatch(/^myField:[a-f0-9]+:/);
		expect(key).toContain('id\n  name');
	});

	test('produces an empty selection key when there is no selection set', () => {
		const info = makeInfo('scalarField');
		const key = resolverCacheKey({}, info);
		expect(key).toBe(`scalarField:${key.split(':')[1]}:`);
	});

	test('produces the same key for identical args and field', () => {
		const info = makeInfo('users', '{ id }');
		const key1 = resolverCacheKey({ limit: 10 }, info);
		const key2 = resolverCacheKey({ limit: 10 }, info);
		expect(key1).toBe(key2);
	});

	test('produces different keys for different args', () => {
		const info = makeInfo('users', '{ id }');
		const key1 = resolverCacheKey({ limit: 10 }, info);
		const key2 = resolverCacheKey({ limit: 20 }, info);
		expect(key1).not.toBe(key2);
	});

	test('produces different keys for different field names', () => {
		const keyA = resolverCacheKey({}, makeInfo('fieldA'));
		const keyB = resolverCacheKey({}, makeInfo('fieldB'));
		expect(keyA).not.toBe(keyB);
	});
});

describe('dedupeResolver', () => {
	test('calls the resolver once and returns the same promise for duplicate invocations', () => {
		const resolver = vi.fn().mockResolvedValue('result');
		const wrapped = dedupeResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		const p1 = wrapped(null, {}, context, info);
		const p2 = wrapped(null, {}, context, info);

		expect(resolver).toHaveBeenCalledTimes(1);
		expect(p1).toBe(p2);
	});

	test('calls the resolver again for different args', () => {
		const resolver = vi.fn().mockResolvedValue('result');
		const wrapped = dedupeResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		wrapped(null, { id: 1 }, context, info);
		wrapped(null, { id: 2 }, context, info);

		expect(resolver).toHaveBeenCalledTimes(2);
	});

	test('uses the override key instead of auto-generating one', () => {
		const resolver = vi.fn().mockResolvedValue('result');
		const wrapped = dedupeResolver(resolver, 'fixed-key');
		const context = makeContext();

		// Different args, but same override key — should still dedupelicate
		wrapped(null, { id: 1 }, context, makeInfo('fieldA'));
		wrapped(null, { id: 2 }, context, makeInfo('fieldB'));

		expect(resolver).toHaveBeenCalledTimes(1);
	});

	test('resolves to the value returned by the resolver', async () => {
		const resolver = vi.fn().mockResolvedValue('hello');
		const wrapped = dedupeResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		const result = await wrapped(null, {}, context, info);
		expect(result).toBe('hello');
	});
});

describe('dedupeRelationalResolver', () => {
	test('calls the resolver once and returns the same promise for duplicate invocations', async () => {
		const resolver = vi.fn().mockResolvedValue('result');
		const wrapped = dedupeRelationalResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		const p1 = wrapped({ source: null, args: {}, context, info });
		const p2 = wrapped({ source: null, args: {}, context, info });

		expect(resolver).toHaveBeenCalledTimes(1);
		expect(await p1).toBe(await p2);
	});

	test('calls the resolver again for different args', async () => {
		const resolver = vi.fn().mockResolvedValue('result');
		const wrapped = dedupeRelationalResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		await wrapped({ source: null, args: { id: 1 }, context, info });
		await wrapped({ source: null, args: { id: 2 }, context, info });

		expect(resolver).toHaveBeenCalledTimes(2);
	});

	test('sets context.data to the resolved value', async () => {
		const resolver = vi.fn().mockResolvedValue({ id: 42 });
		const wrapped = dedupeRelationalResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		await wrapped({ source: null, args: {}, context, info });

		expect(context.data).toEqual({ id: 42 });
	});

	test('resolves to the value returned by the resolver', async () => {
		const resolver = vi.fn().mockResolvedValue('hello');
		const wrapped = dedupeRelationalResolver(resolver);
		const context = makeContext();
		const info = makeInfo('myField');

		const result = await wrapped({ source: null, args: {}, context, info });
		expect(result).toBe('hello');
	});
});
