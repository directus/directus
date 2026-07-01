import type { Server as httpServer } from 'http';
import type { IncomingMessage } from 'http';
import type internal from 'stream';
import { useEnv } from '@directus/env';
import { buildSchema, GraphQLError, NoSchemaIntrospectionCustomRule, validate } from 'graphql';
import type { Context, SubscribePayload } from 'graphql-ws';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GraphQLService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { ConnectionParams } from '../messages.js';
import type { GraphQLSocket, UpgradeContext } from '../types.js';
import { GraphQLSubscriptionController, onSubscribe } from './graphql.js';

vi.mock('@directus/env', () => ({ useEnv: vi.fn().mockReturnValue({}) }));

vi.mock('graphql-ws', async (importOriginal) => {
	const actual = await importOriginal<typeof import('graphql-ws')>();
	return {
		...actual,
		makeServer: vi.fn().mockReturnValue({ opened: vi.fn().mockReturnValue(vi.fn()) }),
	};
});

// Partially mock `graphql` so we keep the real parse/validate behaviour while being able to
// assert which validation rules are applied (for the introspection toggle).
vi.mock('graphql', async (importOriginal) => {
	const actual = await importOriginal<typeof import('graphql')>();
	return { ...actual, validate: vi.fn(actual.validate) };
});

vi.mock('./hooks.js', () => ({ registerWebSocketEvents: vi.fn() }));
vi.mock('../../services/graphql/subscription.js', () => ({ bindPubSub: vi.fn() }));
vi.mock('../../services/index.js', () => ({ GraphQLService: vi.fn() }));
vi.mock('../authenticate.js', () => ({ authenticateConnection: vi.fn() }));
vi.mock('../../utils/get-address.js', () => ({ getAddress: vi.fn().mockReturnValue('') }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({ info: vi.fn(), debug: vi.fn(), trace: vi.fn() }),
}));

afterEach(() => {
	vi.clearAllMocks();
});

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

describe('GraphQL WebSocket onSubscribe', () => {
	beforeEach(() => {
		vi.mocked(useEnv).mockReturnValue({
			GRAPHQL_QUERY_TOKEN_LIMIT: 5000,
			GRAPHQL_INTROSPECTION: true,
		});

		vi.mocked(getSchema).mockResolvedValue({} as any);
		vi.mocked(GraphQLService).mockImplementation(() => ({ getSchema: vi.fn().mockResolvedValue(schema) }) as any);
	});

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

	test('accepts query operations', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'query { foo }' }));

		expect(Array.isArray(result)).toBe(false);
		expect(result).toHaveProperty('document');
	});

	test('accepts mutation operations', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'mutation { foo }' }));

		expect(Array.isArray(result)).toBe(false);
		expect(result).toHaveProperty('document');
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

	test('strips field suggestions from validation errors when introspection is disabled', async () => {
		vi.mocked(useEnv).mockReturnValue({
			GRAPHQL_QUERY_TOKEN_LIMIT: 5000,
			GRAPHQL_INTROSPECTION: false,
		});

		// `fool` is a near-miss for the schema's `foo` field, which would normally be suggested back.
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'subscription { fool }' }));

		expect(Array.isArray(result)).toBe(true);
		const errors = result as readonly GraphQLError[];
		expect(errors.length).toBeGreaterThan(0);
		expect(errors.some((error) => /Did you mean/.test(error.message))).toBe(false);
		expect(errors.some((error) => /"foo"/.test(error.message))).toBe(false);
	});

	test('returns validation errors from the resolved schema', async () => {
		const result = await onSubscribe(mockContext(), '1', payload({ query: 'subscription { nonExistentField }' }));

		expect(Array.isArray(result)).toBe(true);
		expect((result as readonly GraphQLError[]).length).toBeGreaterThan(0);
		expect((result as readonly GraphQLError[])[0]).toBeInstanceOf(GraphQLError);
	});
});

function getMockServer() {
	return {
		on: vi.fn(),
	} as unknown as httpServer;
}

describe('GraphQLSubscriptionController handshake upgrade', () => {
	let controller: InstanceType<typeof GraphQLSubscriptionController>;

	beforeEach(() => {
		vi.mocked(useEnv).mockReturnValue({
			WEBSOCKETS_GRAPHQL_PATH: '/graphql',
			WEBSOCKETS_GRAPHQL_AUTH: 'handshake',
			WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT: 10,
			RATE_LIMITER_ENABLED: false,
		});

		controller = new GraphQLSubscriptionController(getMockServer());
	});

	test('propagates accountability overrides (ip/userAgent/origin) from the upgrade request', async () => {
		// Stub handleUpgrade to synchronously invoke its callback with a fake socket
		const fakeWs = {} as any;

		vi.spyOn(controller.server, 'handleUpgrade').mockImplementation((_req, _socket, _head, cb: any) => {
			cb(fakeWs);
		});

		// no-op implementation so the real 'connection' handler doesn't run; we only assert the emitted args
		const emitSpy = vi.spyOn(controller.server, 'emit').mockReturnValue(true);

		const context: UpgradeContext = {
			request: {} as IncomingMessage,
			socket: {} as internal.Duplex,
			head: Buffer.from(''),
			accountabilityOverrides: {
				ip: '203.0.113.5',
				userAgent: 'regression-test-agent',
				origin: 'https://example.com',
			},
		};

		// handleHandshakeUpgrade is protected; access via index signature for the test
		await (controller as any).handleHandshakeUpgrade(context);

		expect(emitSpy).toHaveBeenCalledWith(
			'connection',
			fakeWs,
			expect.objectContaining({
				accountability: expect.objectContaining({
					ip: '203.0.113.5',
					userAgent: 'regression-test-agent',
					origin: 'https://example.com',
					// regression guard: the IP must NOT be dropped to null (GHSA-jvxj-w2qp-5vmx)
					admin: false,
				}),
				expires_at: null,
			}),
		);
	});
});
