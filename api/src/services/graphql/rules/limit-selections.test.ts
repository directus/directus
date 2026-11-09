import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../../logger/index.js';
import { resetEnv, setEnv } from '../../../test-utils/env.js';
import { createMockLogger } from '../../../test-utils/logger.js';
import { countSelections, limitSelections } from './limit-selections.js';

// Keep the real module so DEFAULTS stays available to the limit lookup
vi.mock('@directus/env', async (importOriginal) => {
	const { mockEnv } = await import('../../../test-utils/env.js');
	return { ...(await importOriginal<typeof import('@directus/env')>()), ...mockEnv() };
});

vi.mock('../../../logger/index.js');

let logger: ReturnType<typeof createMockLogger>;

beforeEach(() => {
	resetEnv();

	logger = createMockLogger();
	vi.mocked(useLogger).mockReturnValue(logger as any);
});

const schema = buildSchema(`
	type Role { id: ID, users: [User] }
	type User { id: ID, email: String, role: Role }
	type Query { users: [User], roles: [Role] }
`);

/** `Fi { a: role { users { ...Fi-1 } } b: role { users { ...Fi-1 } } }`, which expands to 2^depth paths */
function buildAliasChain(depth: number) {
	const fragments = ['fragment F0 on User { id }'];

	for (let level = 1; level <= depth; level++) {
		const nested = `role { users { ...F${level - 1} } }`;
		fragments.push(`fragment F${level} on User { a: ${nested} b: ${nested} }`);
	}

	return `query { users { ...F${depth} } } ${fragments.join(' ')}`;
}

function count(query: string) {
	const document = parse(query);

	const fragments = new Map(
		document.definitions.flatMap((d) => (d.kind === 'FragmentDefinition' ? [[d.name.value, d]] : [])),
	);

	const operation = document.definitions.find((d) => d.kind === 'OperationDefinition')!;

	return countSelections(operation.selectionSet, (name) => fragments.get(name));
}

function validateQuery(query: string, operationName?: string) {
	return validate(schema, parse(query), [...specifiedRules, limitSelections(operationName)]);
}

describe('countSelections', () => {
	test('counts every field, nested ones included', () => {
		expect(count('{ users { id role { id } } }')).toBe(4);
	});

	test('counts the fields of a fragment everywhere it is spread', () => {
		expect(count('{ users { ...F role { users { ...F } } } } fragment F on User { id email }')).toBe(7);
	});

	test('counts the fields of inline fragments', () => {
		expect(count('{ users { ... on User { id } } }')).toBe(2);
	});

	test('counts a fragment spread twice into the same selection set twice', () => {
		expect(count('{ users { ...F ...F } } fragment F on User { id }')).toBe(3);
	});

	test('counts a chain of aliased spreads without expanding it', () => {
		// 2^40 paths, which only terminates because each fragment is sized once
		expect(count(buildAliasChain(40))).toBeGreaterThan(2 ** 40);
	});

	test('does not recurse forever on a fragment cycle', () => {
		expect(count('{ users { ...A } } fragment A on User { id ...B } fragment B on User { ...A }')).toBe(2);
	});

	test('ignores unknown fragments', () => {
		expect(count('{ users { ...Missing } }')).toBe(1);
	});
});

describe('limitSelections', () => {
	test('allows an operation within the limit', () => {
		expect(validateQuery('{ users { id email role { id } } }')).toEqual([]);
	});

	test('rejects an aliased fragment chain before it is expanded', () => {
		const errors = validateQuery(buildAliasChain(18));

		expect(errors).toHaveLength(1);
		expect(errors[0]?.message).toContain('maximum allowed selection count of 10000');
	});

	test('rejects a chain of fragments that each spread the one below twice', () => {
		// `Fk { ...Fk-1 ...Fk-1 }` expands to 2^k fields without a single alias
		const fragments = ['fragment F0 on User { id }'];

		for (let level = 1; level <= 20; level++) {
			fragments.push(`fragment F${level} on User { ...F${level - 1} ...F${level - 1} }`);
		}

		expect(validateQuery(`query { users { ...F20 } } ${fragments.join(' ')}`)).toHaveLength(1);
	});

	test('counts the root fields of an operation together', () => {
		setEnv({ GRAPHQL_QUERY_SELECTION_LIMIT: 3 });

		expect(validateQuery('{ users { id } }')).toEqual([]);
		expect(validateQuery('{ users { id } roles { id } }')).toHaveLength(1);
	});

	test('only checks the operation that will be executed', () => {
		setEnv({ GRAPHQL_QUERY_SELECTION_LIMIT: 2 });

		const query = 'query Small { users { id } } query Large { users { id email } }';

		expect(validateQuery(query, 'Small')).toEqual([]);
		expect(validateQuery(query, 'Large')).toHaveLength(1);
	});

	test('falls back to the default for an invalid limit, and says so', () => {
		setEnv({ GRAPHQL_QUERY_SELECTION_LIMIT: 'nope' });

		expect(validateQuery(buildAliasChain(18))[0]?.message).toContain('10000');
		expect(logger.warn).toHaveBeenCalledWith('Invalid value for GRAPHQL_QUERY_SELECTION_LIMIT, falling back to 10000.');
	});

	test('honors Infinity as an opt-out', () => {
		setEnv({ GRAPHQL_QUERY_SELECTION_LIMIT: Infinity });

		expect(validateQuery(buildAliasChain(18))).toEqual([]);
	});
});
