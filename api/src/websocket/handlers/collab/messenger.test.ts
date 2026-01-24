import { randomUUID } from 'crypto';
import { type BroadcastMessage, COLLAB_BUS } from '@directus/types/collab';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Messenger } from './messenger.js';

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		WEBSOCKETS_COLLAB_INSTANCE_TIMEOUT: 1000, // 1 second for testing
	}),
}));

const mockBus = {
	publish: vi.fn(),
	subscribe: vi.fn(),
	unsubscribe: vi.fn(),
};

vi.mock('../../../bus/index.js', () => ({
	useBus: () => mockBus,
}));

// Mock Store (using in-memory map similar to room.test.ts)
const mockData = new Map();
const mockLocks = new Map();

vi.mock('./store.js', () => {
	return {
		useStore: (uid: string, defaults?: any) => {
			return async (callback: any) => {
				const lock = mockLocks.get(uid) || Promise.resolve();

				const nextLock = lock.then(async () => {
					return await callback({
						has: async (key: string) => mockData.has(`${uid}:${key}`),
						get: async (key: string) => {
							return mockData.get(`${uid}:${key}`) ?? defaults?.[key];
						},
						set: async (key: string, value: any) => {
							mockData.set(`${uid}:${key}`, value);
						},
						delete: async (key: string) => {
							mockData.delete(`${uid}:${key}`);
						},
					});
				});

				mockLocks.set(
					uid,
					nextLock.catch(() => {}),
				);

				return nextLock;
			};
		},
	};
});

describe('Messenger', () => {
	let messenger: Messenger;

	beforeEach(() => {
		vi.clearAllMocks();
		mockData.clear();
		mockLocks.clear();
		messenger = new Messenger();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		test('initializes with a UUID and registers instance', async () => {
			expect(messenger.uid).toBeDefined();
			expect(mockBus.subscribe).toHaveBeenCalled();

			const instances = mockData.get('registry:instances');
			expect(instances).toEqual({ [messenger.uid]: { clients: [], rooms: [] } });
		});

		test('subscribes to COLLAB_BUS', () => {
			expect(mockBus.subscribe).toHaveBeenCalledWith(COLLAB_BUS, expect.any(Function));
		});
	});

	describe('Room Listeners', () => {
		test('setRoomListener registers a callback', () => {
			const callback = vi.fn();
			messenger.setRoomListener('room-1', callback);

			expect(messenger.roomListeners['room-1']).toBe(callback);
		});

		test('removeRoomListener removes the callback', () => {
			const callback = vi.fn();
			messenger.setRoomListener('room-1', callback);
			messenger.removeRoomListener('room-1');

			expect(messenger.roomListeners['room-1']).toBeUndefined();
		});

		test('invokes listener when room message is received', () => {
			const callback = vi.fn();
			messenger.setRoomListener('room-1', callback);

			// Simulate incoming message
			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];
			const message = { type: 'room', room: 'room-1', message: { test: true } };
			busHandler?.(message);

			expect(callback).toHaveBeenCalledWith(message);
		});
	});

	describe('Client Management', () => {
		const mockClient = {
			uid: 'client-1',
			send: vi.fn(),
			on: vi.fn(),
		} as any;

		test('addClient registers client and updates store', async () => {
			messenger.addClient(mockClient);

			expect(messenger.clients['client-1']).toBe(mockClient);
			expect(messenger.orders['client-1']).toBe(0);

			await new Promise(process.nextTick);

			const instances = mockData.get('registry:instances');
			expect(instances[messenger.uid].clients).toContain('client-1');
		});

		test('addClient ignores duplicate registration', async () => {
			messenger.addClient(mockClient);
			const initialClients = { ...messenger.clients };

			// Try adding same client again
			messenger.addClient(mockClient);

			// Should be same object reference
			expect(messenger.clients['client-1']).toBe(initialClients['client-1']);

			await new Promise(process.nextTick);

			// Should verify store wasn't appended with duplicate
			const instances = mockData.get('registry:instances');
			expect(instances[messenger.uid].clients.filter((id: string) => id === 'client-1')).toHaveLength(1);
		});

		test('addClient sets up close handler', () => {
			messenger.addClient(mockClient);

			expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
		});

		test('removeClient unregisters client and updates store', async () => {
			messenger.addClient(mockClient);
			await new Promise(process.nextTick); // clean tick

			messenger.removeClient('client-1');

			expect(messenger.clients['client-1']).toBeUndefined();
			expect(messenger.orders['client-1']).toBeUndefined();

			// wait for store update
			await new Promise(process.nextTick);

			const instances = mockData.get('registry:instances');
			expect(instances[messenger.uid].clients).not.toContain('client-1');
		});

		test('client close triggers removeClient', () => {
			messenger.addClient(mockClient);

			const closeHandler = mockClient.on.mock.calls.find((call: any) => call[0] === 'close')[1];
			const removeSpy = vi.spyOn(messenger, 'removeClient');

			closeHandler();

			expect(removeSpy).toHaveBeenCalledWith('client-1');
		});

		test('registerRoom and unregisterRoom', async () => {
			await messenger.registerRoom('room-1');
			let instances = mockData.get('registry:instances');
			expect(instances[messenger.uid].rooms).toContain('room-1');

			await messenger.unregisterRoom('room-1');
			instances = mockData.get('registry:instances');
			expect(instances[messenger.uid].rooms).not.toContain('room-1');
		});

		test('hasClient returns true for local and false for remote', () => {
			messenger.addClient(mockClient);
			expect(messenger.hasClient('client-1')).toBe(true);
			expect(messenger.hasClient('remote-client')).toBe(false);
		});
	});

	describe('Message Sending', () => {
		test('sendRoom publishes to bus', () => {
			const message = { action: 'test' };
			messenger.sendRoom('room-1', message as any);

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'room',
				room: 'room-1',
				message,
			});
		});

		test('sendClient publishes to bus for remote clients', () => {
			const message = { action: 'test' };
			messenger.sendClient('remote-client', message as any);

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'send',
				client: 'remote-client',
				message,
			});
		});

		test('sendClient bypasses bus for local clients', () => {
			const localClient = { uid: 'local-1', send: vi.fn(), on: vi.fn() } as any;
			messenger.addClient(localClient);
			mockBus.publish.mockClear();

			const message = { action: 'test' };
			messenger.sendClient('local-1', message as any);

			expect(mockBus.publish).not.toHaveBeenCalled();
			expect(localClient.send).toHaveBeenCalled();
		});

		test('terminateClient publishes to bus for remote clients', () => {
			messenger.terminateClient('remote-client');

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'terminate',
				client: 'remote-client',
			});
		});

		test('terminateClient closes local client directly', () => {
			const localClient = { uid: 'local-1', close: vi.fn(), on: vi.fn() } as any;
			messenger.addClient(localClient);
			mockBus.publish.mockClear();

			messenger.terminateClient('local-1');

			expect(mockBus.publish).not.toHaveBeenCalled();
			expect(localClient.close).toHaveBeenCalled();
		});

		test('sendError publishes to bus for remote clients', () => {
			const error = { code: 'FAIL' };
			messenger.sendError('remote-client', error as any);

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'error',
				client: 'remote-client',
				message: error,
			});
		});

		test('sendError sends to local client directly', () => {
			const localClient = { uid: 'local-1', send: vi.fn(), on: vi.fn() } as any;
			messenger.addClient(localClient);
			mockBus.publish.mockClear();

			const error = { code: 'FAIL' };
			messenger.sendError('local-1', error as any);

			expect(mockBus.publish).not.toHaveBeenCalled();
			expect(localClient.send).toHaveBeenCalled();
		});

		test('delivers error to local client via bus subscription', () => {
			const mockClient = { uid: 'client-1', send: vi.fn(), on: vi.fn() } as any;
			messenger.addClient(mockClient);

			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];
			const error = { type: 'collab', action: 'error', code: 'FAIL' };

			busHandler?.({
				type: 'error',
				client: 'client-1',
				message: error,
			});

			expect(mockClient.send).toHaveBeenCalledWith(JSON.stringify(error));
		});

		test('terminates local client via bus subscription', () => {
			const mockClient = { uid: 'client-1', close: vi.fn(), on: vi.fn() } as any;
			messenger.addClient(mockClient);

			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];

			busHandler?.({
				type: 'terminate',
				client: 'client-1',
			});

			expect(mockClient.close).toHaveBeenCalled();
		});

		test('ignores messages for unknown clients', () => {
			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];

			const message = {
				type: 'send',
				client: 'unknown-client',
				message: { action: 'test' },
			};

			expect(() => busHandler?.(message)).not.toThrow();
		});

		test('responds with pong when receiving ping for own instance', () => {
			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];

			busHandler?.({
				type: 'ping',
				instance: messenger.uid,
			});

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'pong',
				instance: messenger.uid,
			});
		});

		test('ignores ping for other instances', () => {
			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];

			busHandler?.({
				type: 'ping',
				instance: 'other-instance',
			});

			expect(mockBus.publish).not.toHaveBeenCalled();
		});
	});

	describe('pruneDeadInstances', () => {
		test('removes inactive instances and returns disconnected clients', async () => {
			vi.useFakeTimers();

			const deadInstance = randomUUID();
			const aliveInstance = randomUUID();

			// Setup store with dead instance
			mockData.set('registry:instances', {
				[messenger.uid]: { clients: [], rooms: [] }, // current
				[deadInstance]: { clients: ['client-A', 'client-B'], rooms: ['room-A'] },
				[aliveInstance]: { clients: ['client-C'], rooms: [] },
			});

			const promise = messenger.pruneDeadInstances();

			await new Promise((resolve) => process.nextTick(resolve));
			await new Promise((resolve) => process.nextTick(resolve));

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'ping',
				instance: deadInstance,
			});

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'ping',
				instance: aliveInstance,
			});

			// We need to find the listener created inside removeInvalidClients
			// It's the last call to subscribe
			const lastSubscribeCall = mockBus.subscribe.mock.calls.at(-1);
			const pongHandler = lastSubscribeCall?.[1];

			pongHandler?.({ type: 'pong', instance: aliveInstance } as BroadcastMessage);

			await vi.advanceTimersByTimeAsync(11000);

			const disconnected = await promise;

			const instances = mockData.get('registry:instances');
			expect(instances).toHaveProperty(aliveInstance);
			expect(instances).not.toHaveProperty(deadInstance);

			expect(disconnected).toEqual({
				inactive: { clients: ['client-A', 'client-B'], rooms: ['room-A'] },
				active: ['client-C'],
			});

			vi.useRealTimers();
		});

		test('handles undefined instances gracefully', async () => {
			vi.useFakeTimers();
			mockData.delete('registry:instances'); // Simulate empty/undefined

			const promise = messenger.pruneDeadInstances();
			await vi.advanceTimersByTimeAsync(11000);
			const disconnected = await promise;

			expect(disconnected).toEqual({ inactive: { clients: [], rooms: [] }, active: [] });
			vi.useRealTimers();
		});

		test('safe removal: preserves updates made by other instances during timeout', async () => {
			vi.useFakeTimers();

			// 1. Initial State: dead-uuid exists
			mockData.set('registry:instances', {
				[messenger.uid]: { clients: [], rooms: [] },
				'dead-uuid': { clients: ['client-A'], rooms: ['room-A'] },
			});

			const promise = messenger.pruneDeadInstances();

			// Wait for initial snapshot to happen
			await new Promise((resolve) => process.nextTick(resolve));
			await new Promise((resolve) => process.nextTick(resolve));

			// 2. Simulate concurrent update during timeout
			// Another instance registers 'new-uuid'
			// We modify mockData directly to simulate the store state changing "underneath"
			const current = mockData.get('registry:instances');

			mockData.set('registry:instances', {
				...current,
				'new-uuid': { clients: ['client-B'], rooms: [] },
			});

			await vi.advanceTimersByTimeAsync(11000);

			const disconnected = await promise;

			const result = mockData.get('registry:instances');
			expect(result).not.toHaveProperty('dead-uuid');

			expect(result).toHaveProperty('new-uuid');

			expect(disconnected).toEqual({
				inactive: { clients: ['client-A'], rooms: ['room-A'] },
				active: ['client-B'],
			});

			vi.useRealTimers();
		});
	});
});
