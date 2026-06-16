import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql';
import { buildSchema, Kind, parse, validate } from 'graphql';
import { describe, expect, test } from 'vitest';
import { findExcessiveSensitiveMutation, limitSensitiveMutations } from './limit-sensitive-mutations.js';

const schema = buildSchema(`
	type Query {
		ping: String
	}

	type AuthTokens {
		access_token: String
	}

	type Mutation {
		auth_login(email: String!, password: String!): AuthTokens
		auth_password_request(email: String!): Boolean
		auth_password_reset(token: String!, password: String!): Boolean
		users_register(email: String!, password: String!): Boolean
		auth_logout: Boolean
	}
`);

function validateQuery(query: string, operationName?: string | null) {
	return validate(schema, parse(query), [limitSensitiveMutations(operationName)]);
}

/** Parse a document and expose its operation (by name, or the first) plus a fragment lookup. */
function parseOperation(query: string, operationName?: string) {
	const document = parse(query);
	const fragments = new Map<string, FragmentDefinitionNode>();

	for (const definition of document.definitions) {
		if (definition.kind === Kind.FRAGMENT_DEFINITION) fragments.set(definition.name.value, definition);
	}

	const operation = document.definitions.find(
		(definition): definition is OperationDefinitionNode =>
			definition.kind === Kind.OPERATION_DEFINITION &&
			(operationName === undefined || definition.name?.value === operationName),
	);

	if (!operation) throw new Error(`No operation${operationName ? ` named ${operationName}` : ''} found`);

	return { operation, getFragment: (name: string) => fragments.get(name) };
}

describe('limitSensitiveMutations', () => {
	test('allows a single invocation of a sensitive mutation', () => {
		const errors = validateQuery(`mutation { auth_login(email: "a@b.c", password: "x") { access_token } }`);
		expect(errors).toHaveLength(0);
	});

	test('allows distinct sensitive mutations once each', () => {
		const errors = validateQuery(`mutation {
			auth_login(email: "a@b.c", password: "x") { access_token }
			auth_password_request(email: "a@b.c")
			users_register(email: "a@b.c", password: "x")
		}`);

		expect(errors).toHaveLength(0);
	});

	test('rejects aliased duplicate auth_login (account-lockout amplifier)', () => {
		const errors = validateQuery(`mutation {
			a: auth_login(email: "a@b.c", password: "1") { access_token }
			b: auth_login(email: "a@b.c", password: "2") { access_token }
		}`);

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});

	test('reports a single error and stops early on the first excess invocation', () => {
		const aliases = Array.from(
			{ length: 30 },
			(_, i) => `l${i}: auth_login(email: "a@b.c", password: "${i}") { access_token }`,
		);

		const errors = validateQuery(`mutation { ${aliases.join(' ')} }`);

		// The walk short-circuits at the second invocation, so a single error is enough to reject.
		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});

	test('rejects aliased duplicate auth_password_request (mail-flood amplifier)', () => {
		const errors = validateQuery(`mutation {
			p1: auth_password_request(email: "victim@b.c")
			p2: auth_password_request(email: "victim@b.c")
			p3: auth_password_request(email: "other@b.c")
		}`);

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_password_request" can only be used once per request');
	});

	test('ignores non-sensitive mutations invoked repeatedly', () => {
		const errors = validateQuery(`mutation {
			a: auth_logout
			b: auth_logout
			c: auth_logout
		}`);

		expect(errors).toHaveLength(0);
	});

	test('allows the same sensitive mutation once in each of several named operations', () => {
		// Only the operation selected via operationName executes, so counting must
		// not sum invocations across sibling operations.
		const errors = validateQuery(`
			mutation Login1 { auth_login(email: "a@b.c", password: "primary") { access_token } }
			mutation Login2 { auth_login(email: "a@b.c", password: "fallback") { access_token } }
		`);

		expect(errors).toHaveLength(0);
	});

	test('still rejects aliased duplicates within a single named operation', () => {
		const errors = validateQuery(`
			mutation Good { auth_login(email: "a@b.c", password: "x") { access_token } }
			mutation Bad {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}
		`);

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});

	test('only validates the operation selected by operationName', () => {
		const query = `
			mutation Safe { auth_login(email: "a@b.c", password: "x") { access_token } }
			mutation Amplify {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}
		`;

		// Executing the safe operation passes, even though a sibling operation is over the limit.
		expect(validateQuery(query, 'Safe')).toHaveLength(0);

		// Executing the offending operation is still rejected.
		const errors = validateQuery(query, 'Amplify');
		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});

	test('skips anonymous operations when an operationName is supplied', () => {
		const errors = validateQuery(
			`mutation {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}`,
			'Named',
		);

		expect(errors).toHaveLength(0);
	});

	test('counts a fragment spread more than once in the same operation', () => {
		const errors = validateQuery(`
			mutation { ...Once ...Once }
			fragment Once on Mutation {
				auth_login(email: "a@b.c", password: "1") { access_token }
			}
		`);

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});

	test('does not count fragments that are only spread in a sibling operation', () => {
		const errors = validateQuery(`
			mutation A { ...F }
			mutation B { ...F }
			fragment F on Mutation {
				auth_login(email: "a@b.c", password: "x") { access_token }
			}
		`);

		expect(errors).toHaveLength(0);
	});

	test('counts sensitive fields smuggled through a mutation-typed fragment', () => {
		const errors = validateQuery(`
			mutation { ...Amplify }
			fragment Amplify on Mutation {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}
		`);

		expect(errors).toHaveLength(1);
		expect(errors[0]!.message).toContain('"auth_login" can only be used once per request');
	});
});

describe('findExcessiveSensitiveMutation', () => {
	test('returns undefined when every sensitive mutation stays within the limit', () => {
		const { operation, getFragment } = parseOperation(`mutation {
			auth_login(email: "a@b.c", password: "1") { access_token }
			auth_password_request(email: "a@b.c")
		}`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)).toBeUndefined();
	});

	test('returns the first invocation that exceeds the limit', () => {
		const { operation, getFragment } = parseOperation(`mutation {
			a: auth_login(email: "a@b.c", password: "1") { access_token }
			b: auth_login(email: "a@b.c", password: "2") { access_token }
			c: auth_login(email: "a@b.c", password: "3") { access_token }
		}`);

		const excess = findExcessiveSensitiveMutation(operation, getFragment);

		expect(excess?.fieldName).toBe('auth_login');
		expect(excess?.count).toBe(2);
		expect(excess?.node.alias?.value).toBe('b');
	});

	test('stops walking once the limit is exceeded', () => {
		const { operation, getFragment } = parseOperation(`
			mutation { ...A ...B }
			fragment A on Mutation {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}
			fragment B on Mutation { auth_password_request(email: "a@b.c") }
		`);

		const seen: string[] = [];

		findExcessiveSensitiveMutation(operation, (name) => {
			seen.push(name);
			return getFragment(name);
		});

		// Fragment A trips the limit, so the sibling spread B is never resolved.
		expect(seen).toEqual(['A']);
	});

	test('ignores non-sensitive fields entirely', () => {
		const { operation, getFragment } = parseOperation(`mutation {
			a: auth_logout
			b: auth_logout
		}`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)).toBeUndefined();
	});

	test('counts the same fragment spread more than once', () => {
		const { operation, getFragment } = parseOperation(`
			mutation { ...Once ...Once }
			fragment Once on Mutation { auth_login(email: "a@b.c", password: "1") { access_token } }
		`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)?.count).toBe(2);
	});

	test('resolves inline fragments', () => {
		const { operation, getFragment } = parseOperation(`mutation {
			... on Mutation {
				a: auth_login(email: "a@b.c", password: "1") { access_token }
				b: auth_login(email: "a@b.c", password: "2") { access_token }
			}
		}`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)?.fieldName).toBe('auth_login');
	});

	test('scopes counting to the given operation', () => {
		const query = `
			mutation Login1 { auth_login(email: "a@b.c", password: "primary") { access_token } }
			mutation Login2 { auth_login(email: "a@b.c", password: "fallback") { access_token } }
		`;

		for (const name of ['Login1', 'Login2']) {
			const { operation, getFragment } = parseOperation(query, name);
			expect(findExcessiveSensitiveMutation(operation, getFragment)).toBeUndefined();
		}
	});

	test('terminates on a fragment cycle within the limit', () => {
		const { operation, getFragment } = parseOperation(`
			mutation { ...A }
			fragment A on Mutation { auth_login(email: "a@b.c", password: "1") { access_token } ...B }
			fragment B on Mutation { auth_password_request(email: "a@b.c") ...A }
		`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)).toBeUndefined();
	});

	test('ignores unresolvable fragment spreads', () => {
		const { operation, getFragment } = parseOperation(`mutation { ...Missing }`);

		expect(findExcessiveSensitiveMutation(operation, getFragment)).toBeUndefined();
	});

	test('honours a custom max', () => {
		const { operation, getFragment } = parseOperation(`mutation {
			a: auth_login(email: "a@b.c", password: "1") { access_token }
			b: auth_login(email: "a@b.c", password: "2") { access_token }
		}`);

		expect(findExcessiveSensitiveMutation(operation, getFragment, 2)).toBeUndefined();
	});
});
