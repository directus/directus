import type { Server as httpServer } from 'http';
import type { IncomingMessage } from 'http';
import type internal from 'stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { UpgradeContext } from '../types.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		WEBSOCKETS_GRAPHQL_PATH: '/graphql',
		WEBSOCKETS_GRAPHQL_AUTH: 'handshake',
		WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT: 10,
		RATE_LIMITER_ENABLED: false,
	}),
}));

vi.mock('graphql-ws', async (importOriginal) => {
	const actual = await importOriginal<typeof import('graphql-ws')>();
	return {
		...actual,
		makeServer: vi.fn().mockReturnValue({ opened: vi.fn().mockReturnValue(vi.fn()) }),
	};
});

vi.mock('../../services/index.js', () => ({ GraphQLService: vi.fn() }));
vi.mock('../../services/graphql/subscription.js', () => ({ bindPubSub: vi.fn() }));
vi.mock('./hooks.js', () => ({ registerWebSocketEvents: vi.fn() }));
vi.mock('../../utils/get-address.js', () => ({ getAddress: vi.fn().mockReturnValue('') }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));
vi.mock('../authenticate.js', () => ({ authenticateConnection: vi.fn() }));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({ info: vi.fn(), debug: vi.fn(), trace: vi.fn() }),
}));

// Import after mocks so the module picks them up
const { GraphQLSubscriptionController } = await import('./graphql.js');

function getMockServer() {
	return {
		on: vi.fn(),
	} as unknown as httpServer;
}

describe('GraphQLSubscriptionController handshake upgrade', () => {
	let controller: InstanceType<typeof GraphQLSubscriptionController>;

	beforeEach(() => {
		controller = new GraphQLSubscriptionController(getMockServer());
	});

	afterEach(() => {
		vi.clearAllMocks();
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
