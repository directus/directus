import { describe, expect, test } from 'vitest';
import { collectGraphql } from './graphql.js';

describe('collectGraphql', () => {
	test('defaults to no single use mutations', () => {
		expect(collectGraphql({})).toStrictEqual({ introspection: false, single_use_mutations: 0 });
	});

	test('reports only the number of configured mutations, not their names', () => {
		const result = collectGraphql({
			GRAPHQL_INTROSPECTION: true,
			GRAPHQL_SINGLE_USE_MUTATIONS: ['auth_login', 'utils_cache_clear'],
		});

		expect(result).toStrictEqual({ introspection: true, single_use_mutations: 2 });
	});
});
