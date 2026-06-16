import { useEnv } from '@directus/env';
import { buildSchema, GraphQLError, NoSchemaIntrospectionCustomRule, validate } from 'graphql';
import type { Context, SubscribePayload } from 'graphql-ws';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GraphQLService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { ConnectionParams } from '../messages.js';
import type { GraphQLSocket } from '../types.js';
import { onSubscribe } from './graphql.js';

// Mock the heavy side-effectful module graph that importing the controller pulls in so the test can
// exercise the `onSubscribe` security logic in isolation.
vi.mock('./base.js', () => ({ default: class {} }));
vi.mock('./hooks.js', () => ({ registerWebSocketEvents: vi.fn() }));
vi.mock('../../services/graphql/subscription.js', () => ({ bindPubSub: vi.fn() }));
vi.mock('../authenticate.js', () => ({ authenticateConnection: vi.fn() }));

vi.mock('../../permissions/utils/create-default-accountability.js', () => ({
	createDefaultAccountability: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({ useLogger: vi.fn(() => ({ info: vi.fn() })) }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));
vi.mock('../../services/index.js', () => ({ GraphQLService: vi.fn() }));

// Partially mock `graphql` so we keep the real parse/validate behaviour while being able to assert
// which validation rules are applied (for the introspection toggle).
vi.mock('graphql', async (importOriginal) => {
	const actual = await importOriginal<typeof import('graphql')>();
	return { ...actual, validate: vi.fn(actual.validate) };
});

vi.mock('@directus/env', () => ({ useEnv: vi.fn() }));

const schema = buildSchema(/* GraphQL */ `
	type Query {
		foo: String
	}
	type Mutation {
		foo: String
	}
	type Subscription {
		foo: String
	}
`);

function mockContext(): Context<ConnectionParams, GraphQLSocket> {
	return {
		extra: { client: { accountability: null } },
	} as unknown as Context<ConnectionParams, GraphQLSocket>;
}

function payload(overrides: Partial<SubscribePayload> = {}): SubscribePayload {
	return { query: 'subscription { foo }', ...overrides };
}

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({
		GRAPHQL_QUERY_TOKEN_LIMIT: 5000,
		GRAPHQL_INTROSPECTION: true,
	});

	vi.mocked(getSchema).mockResolvedValue({} as any);
	vi.mocked(GraphQLService).mockImplementation(() => ({ getSchema: vi.fn().mockResolvedValue(schema) }) as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('GraphQL WebSocket onSubscribe', () => {
	// The graphql-ws v6 signature is (ctx, id, payload) - the id and payload are separate arguments,
	// not a single wrapped SubscribeMessage. Calling with three args guards against regressing it.
	test('accepts a valid subscription operation', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'subscription { foo }' }));

		expect(Array.isArray(result)).toBe(false);
		expect(result).toMatchObject({ schema, operationName: undefined, variableValues: undefined });
		expect(result).toHaveProperty('document');
	});

	test('passes through variables and operation name from the payload', async () => {
		const result = await onSubscribe(
			mockContext(),
			'1',
			payload({
				query: 'subscription Foo { foo }',
				operationName: 'Foo',
				variables: { a: 1 },
			}),
		);

		expect(result).toMatchObject({ operationName: 'Foo', variableValues: { a: 1 } });
	});

	test('rejects query operations', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'query { foo }' }));

		expect(result).toEqual([new GraphQLError('Only subscription operations are supported over WebSocket.')]);
	});

	test('rejects mutation operations', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'mutation { foo }' }));

		expect(result).toEqual([new GraphQLError('Only subscription operations are supported over WebSocket.')]);
	});

	test('applies GRAPHQL_QUERY_TOKEN_LIMIT as maxTokens when parsing', async () => {
		vi.mocked(useEnv).mockReturnValue({
			GRAPHQL_QUERY_TOKEN_LIMIT: 1,
			GRAPHQL_INTROSPECTION: true,
		});

		const result = await onSubscribe(mockContext(), '1', payload({ query: 'subscription { foo }' }));

		expect(result).toEqual([new GraphQLError('Failed to parse GraphQL document.')]);
	});

	test('honours GRAPHQL_INTROSPECTION=false by adding the no-introspection rule', async () => {
		vi.mocked(useEnv).mockReturnValue({
			GRAPHQL_QUERY_TOKEN_LIMIT: 5000,
			GRAPHQL_INTROSPECTION: false,
		});

		await onSubscribe(mockContext(), '1', payload());

		expect(validate).toHaveBeenCalledTimes(1);
		const rules = vi.mocked(validate).mock.calls[0]![2];
		expect(rules).toContain(NoSchemaIntrospectionCustomRule);
	});

	test('does not add the no-introspection rule when introspection is enabled', async () => {
		await onSubscribe(mockContext(), '1', payload());

		expect(validate).toHaveBeenCalledTimes(1);
		const rules = vi.mocked(validate).mock.calls[0]![2];
		expect(rules).not.toContain(NoSchemaIntrospectionCustomRule);
	});

	test('returns validation errors from the resolved schema', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'subscription { nonExistentField }' }));

		expect(Array.isArray(result)).toBe(true);
		expect((result as readonly GraphQLError[]).length).toBeGreaterThan(0);
		expect((result as readonly GraphQLError[])[0]).toBeInstanceOf(GraphQLError);
	});
});
