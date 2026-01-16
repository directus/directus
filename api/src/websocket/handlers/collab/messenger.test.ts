import { type BroadcastMessage, COLLAB_BUS } from '@directus/types/collab';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Messenger } from './messenger.js';

// Mock dependencies
vi.mock('crypto', () => ({
	randomUUID: vi.fn(() => 'mock-uuid'),
}));

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		WEBSOCKETS_COLLAB_INSTANCE_TIMEOUT: 1, // 1 second for testing
	}),
}));

// Mock Bus
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
		useStore: (uid: string) => {
			return async (callback: any) => {
				const lock = mockLocks.get(uid) || Promise.resolve();

				const nextLock = lock.then(async () => {
					return await callback({
						has: async (key: string) => mockData.has(`${uid}:${key}`),
						get: async (key: string) => mockData.get(`${uid}:${key}`),
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
			expect(messenger.uid).toBe('mock-uuid');
			expect(mockBus.subscribe).toHaveBeenCalled();

			const instances = mockData.get('rooms:instances');
			expect(instances).toEqual({ 'mock-uuid': [] });
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

			expect(messenger.clients['client-1']).toBe(mockClient);
			expect(messenger.orders['client-1']).toBe(0);

			await new Promise(process.nextTick);

			const instances = mockData.get('rooms:instances');
			expect(instances['mock-uuid']).toContain('client-1');
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

			const instances = mockData.get('rooms:instances');
			expect(instances['mock-uuid']).not.toContain('client-1');
		});

		test('client close triggers removeClient', () => {
			messenger.addClient(mockClient);

			const closeHandler = mockClient.on.mock.calls.find((call: any) => call[0] === 'close')[1];
			const removeSpy = vi.spyOn(messenger, 'removeClient');

			closeHandler();

			expect(removeSpy).toHaveBeenCalledWith('client-1');
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

		test('sendClient publishes to bus', () => {
			const message = { action: 'test' };
			messenger.sendClient('client-1', message as any);

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'send',
				client: 'client-1',
				message,
			});
		});

		test('delivers message to local client via bus subscription', () => {
			const mockClient = {
				uid: 'client-1',
				send: vi.fn(),
				on: vi.fn(),
			} as any;

			messenger.addClient(mockClient);

			// Simulate incoming "send" message
			const busHandler = mockBus.subscribe.mock.calls[0]?.[1];

			const message = {
				type: 'send',
				client: 'client-1',
				message: { action: 'hello' },
			};

			busHandler?.(message);

			expect(mockClient.send).toHaveBeenCalledWith(
				JSON.stringify({
					action: 'hello',
					order: 0,
				}),
			);

			// Verify order increment
			expect(messenger.orders['client-1']).toBe(1);
		});
	});

	describe('removeInvalidClients', () => {
		test('removes inactive instances and returns disconnected clients', async () => {
			vi.useFakeTimers();

			// Setup store with dead instance
			mockData.set('rooms:instances', {
				'mock-uuid': [], // current
				'00000000-0000-0000-0000-000000000000': ['client-A', 'client-B'],
				'00000000-0000-0000-0000-000000000001': ['client-C'],
			});

			const promise = messenger.removeInvalidClients();

			await new Promise((resolve) => process.nextTick(resolve));
			await new Promise((resolve) => process.nextTick(resolve));

			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'ping',
				instance: '00000000-0000-0000-0000-000000000000',
			});
			expect(mockBus.publish).toHaveBeenCalledWith(COLLAB_BUS, {
				type: 'ping',
				instance: '00000000-0000-0000-0000-000000000001',
			});

			// We need to find the listener created inside removeInvalidClients
			// It's the last call to subscribe
			const lastSubscribeCall = mockBus.subscribe.mock.calls.at(-1);
			const pongHandler = lastSubscribeCall?.[1];

			pongHandler?.({ type: 'pong', instance: '00000000-0000-0000-0000-000000000001' } as BroadcastMessage);

			await vi.advanceTimersByTimeAsync(1500);

			const disconnected = await promise;

			const instances = mockData.get('rooms:instances');
			expect(instances).toHaveProperty('00000000-0000-0000-0000-000000000001');
			expect(instances).not.toHaveProperty('00000000-0000-0000-0000-000000000000');

			expect(disconnected).toEqual(['client-A', 'client-B']);

			vi.useRealTimers();
		});

		test('handles undefined instances gracefully', async () => {
			vi.useFakeTimers();
			mockData.delete('rooms:instances'); // Simulate empty/undefined

			const promise = messenger.removeInvalidClients();
			await vi.advanceTimersByTimeAsync(1500);
			const disconnected = await promise;

			expect(disconnected).toEqual([]);
			vi.useRealTimers();
		});

		test('safe removal: preserves updates made by other instances during timeout', async () => {
			vi.useFakeTimers();

			// 1. Initial State: dead-uuid exists
			mockData.set('rooms:instances', {
				'mock-uuid': [],
				'dead-uuid': ['client-A'],
			});

			const promise = messenger.removeInvalidClients();

			// Wait for initial snapshot to happen
			await new Promise((resolve) => process.nextTick(resolve));
			await new Promise((resolve) => process.nextTick(resolve));

			// 2. Simulate concurrent update during timeout
			// Another instance registers 'new-uuid'
			// We modify mockData directly to simulate the store state changing "underneath"
			const current = mockData.get('rooms:instances');

			mockData.set('rooms:instances', {
				...current,
				'new-uuid': ['client-B'],
			});

			await vi.advanceTimersByTimeAsync(1500);

			const disconnected = await promise;

			const result = mockData.get('rooms:instances');
			expect(result).not.toHaveProperty('dead-uuid');

			expect(result).toHaveProperty('new-uuid');

			expect(disconnected).toEqual(['client-A']);

			vi.useRealTimers();
		});
	});
});
