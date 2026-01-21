import { randomUUID } from 'node:crypto';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../../emitter.js';
import { useLogger } from '../../../logger/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { permissionCache } from './permissions-cache.js';
import { getRoomHash, Room, RoomManager } from './room.js';
import { sanitizePayload } from './sanitize-payload.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('../../../database/index.js', () => ({
	default: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockReturnThis(),
	})),
}));

vi.mock('../../../emitter.js', () => ({
	default: {
		onAction: vi.fn(),
		offAction: vi.fn(),
		emitAction: vi.fn(),
	},
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	}),
}));

vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');
vi.mock('./verify-permissions.js');
vi.mock('./field-permissions.js');
vi.mock('../../../utils/get-service.js');
vi.mock('../../../permissions/lib/fetch-permissions.js');
vi.mock('../../../permissions/lib/fetch-policies.js');
vi.mock('../../../permissions/utils/extract-required-dynamic-variable-context.js');
vi.mock('../../../permissions/utils/fetch-dynamic-variable-data.js');
vi.mock('../../../permissions/utils/process-permissions.js');
vi.mock('../../../permissions/modules/validate-access/lib/validate-item-access.js');

const mockMessenger = {
	sendClient: vi.fn(),
	sendRoom: vi.fn(),
	setRoomListener: vi.fn(),
	removeRoomListener: vi.fn(),
	addClient: vi.fn(),
	removeClient: vi.fn(),
	registerRoom: vi.fn(),
	unregisterRoom: vi.fn(),
} as any;

const getAccountability = (overrides = {}) =>
	merge(
		{
			user: 'Mock User',
			role: 'Mock Role',
			roles: ['Mock Role'],
			app: false,
			admin: false,
			ip: '127.0.0.1',
		},
		overrides,
	);

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

afterEach(() => {
	vi.clearAllMocks();
	mockData.clear();
	mockLocks.clear();
});

beforeEach(() => {
	permissionCache.clear();
	vi.mocked(verifyPermissions).mockResolvedValue(['*']);

	vi.mocked(getService).mockReturnValue({
		readOne: vi.fn().mockResolvedValue({ id: 1, date: '2099-01-01' }),
		readSingleton: vi.fn().mockResolvedValue({}),
	} as any);

	vi.mocked(getSchema).mockResolvedValue({
		collections: {
			coll: { primary: 'id', singleton: false, fields: {} },
			articles: { primary: 'id', singleton: false, fields: {} },
		},
		relations: [],
	} as any);
});

function mockWebSocketClient(client: Partial<WebSocketClient>): WebSocketClient {
	const uid = client.uid || randomUUID();

	return merge(
		{
			send: vi.fn(),
			uid,
			accountability: getAccountability({ user: `user-${uid}` }),
			on: vi.fn(),
			close: vi.fn(),
			terminate: vi.fn(),
		},
		client,
	) as WebSocketClient;
}

let testCounter = 0;
const getTestItem = () => `item_${testCounter++}`;

describe('RoomManager', () => {
	describe('createRoom', () => {
		test('creates new room if it does not exist', async () => {
			const roomManager = new RoomManager(mockMessenger);
			const room = await roomManager.createRoom('articles', '1', null);
			expect(room).toBeDefined();
			expect(roomManager.rooms[room.uid]).toBe(room);
		});

		test('returns existing room if it exists', async () => {
			const roomManager = new RoomManager(mockMessenger);
			const room1 = await roomManager.createRoom('articles', '1', null);
			const room2 = await roomManager.createRoom('articles', '1', null);
			expect(room1).toBe(room2);
		});
	});

	test('getRoom', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const room = await roomManager.createRoom('a', getTestItem(), null);
		const roomReference = await roomManager.getRoom(room.uid);

		expect(room).toEqual(roomReference);
	});

	test('getRoom with invalid id', async () => {
		const roomManager = new RoomManager(mockMessenger);

		await roomManager.createRoom('a', getTestItem(), null);
		const room = await roomManager.getRoom('invalid');

		expect(room).toBeUndefined();
	});

	test('getRoom for uid', async () => {
		const roomManager = new RoomManager(mockMessenger);

		const item = getTestItem();
		await roomManager.createRoom('a', item, null);
		const room = await roomManager.getRoom(getRoomHash('a', item, null));

		expect(room).toBeDefined();
	});

	test('getRoom reloads from store if missing in memory', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const item = getTestItem();
		const room = await roomManager.createRoom('a', item, null);

		const uid = room.uid;

		// Simulate memory eviction but store persistence
		delete roomManager.rooms[uid];

		const reloadedRoom = await roomManager.getRoom(uid);

		expect(reloadedRoom).toBeDefined();
		expect(reloadedRoom!.uid).toBe(uid);
		expect(reloadedRoom!.collection).toBe('a');
	});

	test('getClientRooms', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await roomManager.createRoom('a', getTestItem(), null);
		await room.join(client);

		const clientRooms = await roomManager.getClientRooms(client.uid);

		expect(clientRooms).toEqual([room]);
	});

	test('cleanupRooms', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await roomManager.createRoom('a', getTestItem(), null);
		await room.join(client);

		await roomManager.cleanupRooms();

		expect(Object.keys(roomManager.rooms).length).toEqual(1);

		await room.leave(client.uid);

		await roomManager.cleanupRooms();

		expect(Object.keys(roomManager.rooms).length).toEqual(0);

		const roomKeys = ['uid', 'collection', 'item', 'version', 'changes', 'clients', 'focuses'];

		for (const key of roomKeys) {
			const storeKey = `${room.uid}:${key}`;
			expect(mockData.has(storeKey)).toBeFalsy();
		}
	});

	test('cleanupRooms does not remove active rooms', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await roomManager.createRoom('a', getTestItem(), null);
		await room.join(client);

		await roomManager.cleanupRooms();

		// Should still exist because it has a client
		expect(Object.keys(roomManager.rooms)).toContain(room.uid);
		expect(mockData.has(`${room.uid}:uid`)).toBeTruthy();
	});

	test('dispose removes listeners', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const room = await roomManager.createRoom('a', getTestItem(), null);
		const client = mockWebSocketClient({ uid: 'abc' });

		await room.join(client);

		room.dispose();

		expect(emitter.offAction).toHaveBeenCalledWith('a.items.update', expect.any(Function));
		expect(mockMessenger.removeRoomListener).toHaveBeenCalledWith(room.uid);
	});

	test('handles remote close event', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const room = await roomManager.createRoom('remote-test', getTestItem(), null);
		const disposeSpy = vi.spyOn(room, 'dispose');

		// Find the listener callback to simulate incoming message
		const registerCall = mockMessenger.setRoomListener.mock.calls.find((call: any) => call[0] === room.uid);
		expect(registerCall).toBeDefined();
		const callback = registerCall[1];

		callback({ action: 'close', room: room.uid });

		expect(disposeSpy).toHaveBeenCalled();
		expect(roomManager.rooms[room.uid]).toBeUndefined(); // Cannot use getRoom() here as it's mocked
	});

	describe('room disposal stability', () => {
		test('handles update when store is cleared (disposal race)', async () => {
			const roomManager = new RoomManager(mockMessenger);
			const item = getTestItem();
			let room = await roomManager.createRoom('coll', item, null);
			const uid = getRoomHash('coll', item, null);
			const clientA = mockWebSocketClient({ uid: 'abc' });

			await room.join(clientA);

			mockData.clear();

			room = (await roomManager.getRoom(uid))!;

			// Update should not crash and should trigger self-healing
			await expect(room.update(clientA, { title: 'New' })).resolves.not.toThrow();

			// Should have re-populated ALL foundational keys in store
			expect(mockData.get(`${uid}:uid`)).toBe(uid);
			expect(mockData.get(`${uid}:collection`)).toBe('coll');
			expect(mockData.get(`${uid}:changes`)).toEqual({ title: 'New' });
		});

		test('cleanupRooms does not close if a user joined during check', async () => {
			const roomManager = new RoomManager(mockMessenger);
			const item = getTestItem();
			const room = await roomManager.createRoom('a', item, null);

			const originalStore = room.store;
			let intercepted = false;

			// Simulate concurrent join during closure
			room.store = async (callback: any) => {
				if (!intercepted) {
					intercepted = true;

					await originalStore(
						async (s: any) =>
							await s.set('clients', [{ uid: 'abc', accountability: { user: 'user-abc' } as any, color: 'red' }]),
					);
				}

				return await originalStore(callback);
			};

			await roomManager.cleanupRooms();

			expect(roomManager.rooms[room.uid]).toBeDefined();
			expect(mockData.has(`${room.uid}:uid`)).toBeTruthy();

			room.store = originalStore;
		});
	});
});

describe('room', () => {
	test('create room', () => {
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		expect(room).toBeDefined();
	});

	test('join room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		expect(
			vi.mocked(mockMessenger.sendClient).mock.calls.find((c: any) => c[0] === 'abc' && c[1].action === 'init')?.[1],
		).toEqual(
			expect.objectContaining({
				action: 'init',
				collection: 'coll',
				item: item,
				version: null,
				focuses: {},
				connection: 'abc',
				users: [{ user: 'user-abc', connection: 'abc', color: expect.anything() }],
				type: 'collab',
				room: uid,
			}),
		);

		await room.join(clientB);

		expect((await room.getClients()).length).toBe(2);

		expect(await room.hasClient(clientA.uid)).toBeTruthy();
		expect(await room.hasClient(clientB.uid)).toBeTruthy();
		expect(await room.hasClient(clientC.uid)).toBeFalsy();

		expect(
			vi.mocked(mockMessenger.sendClient).mock.calls.find((c: any) => c[0] === 'abc' && c[1].action === 'join')?.[1],
		).toEqual({
			action: 'join',
			connection: 'def',
			color: expect.anything(),
			user: 'user-def',
			type: 'collab',
			room: uid,
		});

		// Only the init message should have been sent (via messenger)
		expect(vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'def')).toHaveLength(1);
	});

	test('join room twice (re-joining)', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		expect((await room.getClients()).length).toBe(1);

		// Join again
		await room.join(clientA);
		expect((await room.getClients()).length).toBe(1); // Should still be 1

		// Should have sent init twice
		const clientAMsgs = vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'abc');
		expect(clientAMsgs.filter((c: any) => c[1].action === 'init')).toHaveLength(2);
	});

	test('leave room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		await room.leave(clientA.uid);

		expect((await room.getClients()).length).toBe(0);
	});

	test('leave room resets changes when last person leaves', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.update(clientA, { title: 'New Title' });

		const changesBefore = await room.getChanges();
		expect(changesBefore).toEqual({ title: 'New Title' });

		await room.leave(clientA.uid);

		const changesAfter = await room.getChanges();
		expect(changesAfter).toEqual({});
	});

	test('leave room does not reset changes if others remain', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);
		await room.update(clientA, { title: 'New Title' });

		await room.leave(clientA.uid);

		const changes = await room.getChanges();
		expect(changes).toEqual({ title: 'New Title' });
	});

	test('leave room clears focus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		await room.focus(clientA, 'title');
		expect(await room.getFocusByUser('abc')).toBe('title');

		await room.leave(clientA.uid);

		expect(await room.getFocusByUser(clientA.uid)).toBeUndefined();
	});

	test('update field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);
		await room.join(clientC);

		vi.mocked(sanitizePayload).mockImplementation(async (payload, _collection, context) => {
			if (
				context.accountability?.user === 'user-abc' ||
				context.accountability?.user === 'user-def' ||
				context.accountability?.user === 'user-hij'
			) {
				return payload;
			}

			return {};
		});

		await room.update(clientA, { id: 5 });

		expect(
			vi.mocked(mockMessenger.sendClient).mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'update')?.[1],
		).toEqual({
			action: 'update',
			field: 'id',
			changes: 5,
			type: 'collab',
			room: uid,
		});

		// clientA: init (joinA), join (joinB), join (joinC)
		expect(vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'abc')).toHaveLength(3);

		// clientB: init (joinB), join (joinC), update
		expect(vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'def')).toHaveLength(3);

		// clientC: init (joinC), update
		expect(vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'hij')).toHaveLength(2);
	});

	test('discard changes', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		await room.update(clientA, { title: 'Changed' });
		expect(mockData.get(`${uid}:changes`)).toEqual({ title: 'Changed' });

		vi.mocked(mockMessenger.sendClient).mockClear();

		await room.discard();

		expect(mockData.get(`${uid}:changes`)).toEqual({});

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'discard',
			}),
		);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'def',
			expect.objectContaining({
				action: 'discard',
			}),
		);
	});

	test('unset field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		await room.unset(clientA, 'publish_date');

		expect(
			vi
				.mocked(mockMessenger.sendClient)
				.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'update' && c[1].field === 'publish_date')?.[1],
		).toEqual({
			action: 'update',
			field: 'publish_date',
			type: 'collab',
			room: uid,
		});
	});

	test('sender does not receive echo', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockResolvedValue({ title: 'New Title' });

		await room.update(clientA, { title: 'New Title' });

		// A (sender) should NOT have the update
		const clientAMsgs = vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'abc');
		const echoUpdate = clientAMsgs.find((c: any) => c[1].action === 'update');
		expect(echoUpdate).toBeUndefined();

		// B (receiver) should have the update
		const clientBMsgs = vi.mocked(mockMessenger.sendClient).mock.calls.filter((c: any) => c[0] === 'def');
		const updateMsg = clientBMsgs.find((c: any) => c[1].action === 'update' && c[1].field === 'title');
		expect(updateMsg).toBeDefined();
	});

	test('multiple clients update different fields', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockImplementation(async (payload) => payload);

		// Simultaneous updates
		await Promise.all([room.update(clientA, { title: 'Title A' }), room.update(clientB, { status: 'published' })]);

		// Verify final state in store
		const changes = mockData.get(`${uid}:changes`);

		expect(changes).toEqual({
			title: 'Title A',
			status: 'published',
		});

		// A should receive B's update
		const msgToA = vi
			.mocked(mockMessenger.sendClient)
			.mock.calls.find((c: any) => c[0] === 'abc' && c[1].action === 'update' && c[1].field === 'status');

		expect(msgToA).toBeDefined();
		expect(msgToA?.[1].changes).toBe('published');

		// B should receive A's update
		const msgToB = vi
			.mocked(mockMessenger.sendClient)
			.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'update' && c[1].field === 'title');

		expect(msgToB).toBeDefined();
		expect(msgToB?.[1].changes).toBe('Title A');
	});

	test('last write wins', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockImplementation(async (payload) => payload);

		// A updates first
		await room.update(clientA, { title: 'Title A' });
		// B updates same field shortly after
		await room.update(clientB, { title: 'Title B' });

		// Verify final state in store
		const changes = mockData.get(`${uid}:changes`);

		expect(changes).toEqual({
			title: 'Title B',
		});

		// Verify the final state
		const updatesToA = vi
			.mocked(mockMessenger.sendClient)
			.mock.calls.filter((c: any) => c[0] === 'abc' && c[1].action === 'update' && c[1].field === 'title');

		expect(updatesToA.find((args: any) => args[1].changes === 'Title B')).toBeDefined();
	});

	test('broadcasts save action when item is updated externally', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ id: item, title: 'Updated' }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		// Simulate external update
		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'save',
			}),
		);
	});

	test('updates valid keys in changes on external update', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		// Pre-populate some changes
		mockData.set(`${uid}:changes`, { title: 'Pending', stale: 'Gone' });

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		// Return item WITHOUT 'stale' field
		const mockService = { readOne: vi.fn().mockResolvedValue({ id: item, title: 'Updated' }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		// Simulate external update
		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		const updatedChanges = mockData.get(`${uid}:changes`);
		expect(updatedChanges).toEqual({ title: 'Pending' }); // 'stale' should be removed
	});

	test('clears primitives that match saved result on external update', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		mockData.set(`${uid}:changes`, { title: 'Saved Title', status: 'draft' });

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ id: item, title: 'Saved Title', status: 'published' }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		const updatedChanges = mockData.get(`${uid}:changes`);
		expect(updatedChanges).toEqual({ status: 'draft' });
	});

	test('clears relational fields entirely on external update', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		mockData.set(`${uid}:changes`, {
			title: 'Keep',
			comments: [{ id: 1, text: 'New comment' }],
			author: { id: 5, name: 'John' },
		});

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = {
			readOne: vi.fn().mockResolvedValue({
				id: item,
				title: 'Different',
				comments: [{ id: 1, text: 'New comment' }],
				author: { id: 5, name: 'John' },
			}),
		};

		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		const updatedChanges = mockData.get(`${uid}:changes`);
		expect(updatedChanges).toEqual({ title: 'Keep' });
	});

	test('handles type mismatch in primary keys during external update', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const itemStr = '15';
		const itemNum = 15;
		const uid = getRoomHash('coll', itemStr, null);
		const room = new Room(uid, 'coll', itemStr, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ id: itemNum, title: 'Updated' }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [itemNum], collection: 'coll' }, {
			accountability: { user: 'external-user' },
		} as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'save',
			}),
		);

		vi.mocked(mockMessenger.sendClient).mockClear();

		await onUpdateHandler({ keys: [99], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		expect(mockMessenger.sendClient).not.toHaveBeenCalled();
	});

	test('broadcasts save action to same user who updated', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		clientA.accountability = { user: 'user-a' } as any;

		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		vi.mocked(mockMessenger.sendClient).mockClear();

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ id: item }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		// Simulate update by same user
		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'user-a' } } as any);

		expect(mockMessenger.sendClient).toHaveBeenCalled();
	});

	test('handles error in external update handler gracefully', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'coll.items.update')![1];

		const mockService = { readOne: vi.fn().mockRejectedValue(new Error('Service Failure')) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		const logger = useLogger();
		const errorSpy = vi.spyOn(logger, 'error');

		// Simulate external update
		await onUpdateHandler({ keys: [item], collection: 'coll' }, { accountability: { user: 'external-user' } } as any);

		expect(errorSpy).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining('External update handler failed'));
	});

	test('broadcasts save action for system collections', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('directus_users', item, null);
		const room = new Room(uid, 'directus_users', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'users.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ id: item, title: 'Updated' }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [item], collection: 'directus_users' }, {
			accountability: { user: 'external-user' },
		} as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'save',
			}),
		);
	});

	test('broadcasts focus message to other clients', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		await room.focus(clientA, 'publish_date');

		expect(
			vi
				.mocked(mockMessenger.sendClient)
				.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'focus' && c[1].field === 'publish_date')?.[1],
		).toEqual({
			action: 'focus',
			field: 'publish_date',
			connection: 'abc',
			type: 'collab',
			room: uid,
		});
	});

	test('retrieves current focus by user', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		// Client A focuses on title
		await room.focus(clientA, 'title');

		// Client A checks focus on title
		const checkA = await room.getFocusByUser('abc');
		expect(checkA).toBe('title');

		// Client B checks focus on title
		const checkB = await room.getFocusByUser('def');
		expect(checkB).toBeUndefined();
	});

	test('focus succeeds for unfocused field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		// Acquire focus
		expect(await room.focus(clientA, 'title')).toBe(true);
		expect(await room.getFocusByUser('abc')).toBe('title');
	});

	test('focus fails when field already focused by another', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		// A acquires focus
		expect(await room.focus(clientA, 'title')).toBe(true);

		// B tries to acquire same field
		expect(await room.focus(clientB, 'title')).toBe(false);

		// Focus should still be with A
		expect(await room.getFocusByUser('abc')).toBe('title');
		expect(await room.getFocusByUser('def')).toBeUndefined();
	});

	test('focus allows refocus of same field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		// Acquire focus
		expect(await room.focus(clientA, 'title')).toBe(true);

		// Refocus on same field
		expect(await room.focus(clientA, 'title')).toBe(true);
		expect(await room.getFocusByUser('abc')).toBe('title');
	});

	test('concurrent focus allows only one to succeed', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		// Both clients try to acquire focus simultaneously
		const [resultA, resultB] = await Promise.all([room.focus(clientA, 'title'), room.focus(clientB, 'title')]);

		// Exactly one should succeed
		const successes = [resultA, resultB].filter((r) => r === true);
		const failures = [resultA, resultB].filter((r) => r === false);

		expect(successes).toHaveLength(1);
		expect(failures).toHaveLength(1);
	});

	test('clears focus and broadcasts release message when focusing null', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		// A acquire focus
		await room.focus(clientA, 'title');
		expect(await room.getFocusByUser('abc')).toBe('title');

		vi.mocked(mockMessenger.sendClient).mockClear();

		// A release focus
		await room.focus(clientA, null);

		// Focus should be cleared
		expect(await room.getFocusByUser('abc')).toBeUndefined();

		// B should receive the release broadcast
		expect(
			vi
				.mocked(mockMessenger.sendClient)
				.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'focus' && c[1].field === null)?.[1],
		).toEqual({
			action: 'focus',
			field: null,
			connection: 'abc',
			type: 'collab',
			room: uid,
		});
	});

	test('focus propagation respects recipient permissions', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(verifyPermissions).mockImplementation(async (acc, _coll, _item) => {
			if (acc?.user === 'user-abc') return ['*'];
			if (acc?.user === 'user-def') return ['title'];
			return [];
		});

		// A focuses on 'secret' (B cannot see this)
		await room.focus(clientA, 'secret');

		// B should NOT receive the focus message
		const msgToB = vi
			.mocked(mockMessenger.sendClient)
			.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'focus');

		expect(msgToB).toBeUndefined();

		// A focuses on 'title' (B CAN see this)
		mockMessenger.sendClient.mockClear();
		await room.focus(clientA, 'title');

		expect(
			vi
				.mocked(mockMessenger.sendClient)
				.mock.calls.find((c: any) => c[0] === 'def' && c[1].action === 'focus' && c[1].field === 'title'),
		).toBeDefined();
	});

	test('batch focus releases on leave', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		await room.focus(clientA, 'title');
		await room.focus(clientB, 'status');

		expect(await room.getFocusByUser('abc')).toBe('title');
		expect(await room.getFocusByUser('def')).toBe('status');

		vi.mocked(mockMessenger.sendClient).mockClear();

		// Client A leaves
		await room.leave('abc');

		// Focus on title should be released
		expect(await room.getFocusByUser('abc')).toBeUndefined();
		// Focus on status should still be there for B
		expect(await room.getFocusByUser('def')).toBe('status');
	});

	test('handles delete event', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const room = await roomManager.createRoom('articles', '1', null);

		const client = {
			uid: 1,
			accountability: { user: 'user1', role: null, roles: [], admin: false, app: false, ip: '::1' },
			send: vi.fn(),
		} as unknown as WebSocketClient;

		await room.join(client);

		roomManager.messenger.setRoomListener(room.uid, (message: any) => {
			if (message.action === 'close') {
				room.dispose();
			}
		});

		const onDeleteHandler = vi
			.mocked(emitter.onAction)
			.mock.calls.find((call) => call[0] === 'articles.items.delete')![1];

		await onDeleteHandler({ keys: ['1'] , collection: 'articles' }, {} as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				type: 'collab',
				room: room.uid,
				action: 'delete',
			}),
		);

		// Room should be disposed with listeners removed
		expect(emitter.offAction).toHaveBeenCalledWith('articles.items.update', expect.any(Function));
		expect(emitter.offAction).toHaveBeenCalledWith('articles.items.delete', expect.any(Function));
	});

	test('ignores delete event for other items', async () => {
		const roomManager = new RoomManager(mockMessenger);
		const room = await roomManager.createRoom('articles', '1', null);

		const client = {
			uid: 1,
			accountability: { user: 'user1', role: null, roles: [], admin: false, app: false, ip: '::1' },
			send: vi.fn(),
		} as unknown as WebSocketClient;

		await room.join(client);

		const onDeleteHandler = vi
			.mocked(emitter.onAction)
			.mock.calls.find((call) => call[0] === 'articles.items.delete')![1];

		await onDeleteHandler({ keys: ['2'], collection: 'articles' }, {} as any);

		expect(mockMessenger.sendClient).not.toHaveBeenCalledWith(
			1,
			expect.objectContaining({
				action: 'delete',
			}),
		);
	});
});

describe('versioned room', () => {
	test('creates room with version property set', async () => {
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);
		await room.ensureInitialized();

		expect(room.version).toBe(versionId);
	});

	test('registers versions.update and versions.delete listeners for versioned rooms', () => {
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		new Room(uid, 'coll', item, versionId, {}, mockMessenger);

		const onActionCalls = vi.mocked(emitter.onAction).mock.calls;
		const versionsUpdateCall = onActionCalls.find((call) => call[0] === 'versions.update');
		const versionsDeleteCall = onActionCalls.find((call) => call[0] === 'versions.delete');

		expect(versionsUpdateCall).toBeDefined();
		expect(versionsDeleteCall).toBeDefined();
	});

	test('does not register item update listener for versioned rooms', () => {
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		new Room(uid, 'coll', item, versionId, {}, mockMessenger);

		const onActionCalls = vi.mocked(emitter.onAction).mock.calls;
		const itemUpdateCall = onActionCalls.find((call) => call[0] === 'coll.items.update');

		expect(itemUpdateCall).toBeUndefined();
	});

	test('onUpdateHandler filters by version ID', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'versions.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ delta: { title: 'Updated' } }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		vi.mocked(mockMessenger.sendClient).mockClear();

		// Matching version
		await onUpdateHandler({ keys: [versionId] }, {} as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'save',
			}),
		);

		vi.mocked(mockMessenger.sendClient).mockClear();

		// Non-matching version
		await onUpdateHandler({ keys: [randomUUID()] }, {} as any);

		expect(mockMessenger.sendClient).not.toHaveBeenCalled();
	});

	test('onDeleteHandler triggers for matching version', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		const onDeleteHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'versions.delete')![1];

		vi.mocked(mockMessenger.sendClient).mockClear();

		await onDeleteHandler({ keys: [versionId], collection: 'directus_versions' }, {} as any);

		expect(mockMessenger.sendClient).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining({
				action: 'delete',
			}),
		);
	});

	test('preserves changes not in delta for versioned rooms', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		mockData.set(`${uid}:changes`, { title: 'Pending Title', status: 'draft' });

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'versions.update')![1];

		const mockService = { readOne: vi.fn().mockResolvedValue({ delta: { title: 'Saved Title' } }) };
		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [versionId] }, {} as any);

		const updatedChanges = mockData.get(`${uid}:changes`);

		expect(updatedChanges).toEqual({ title: 'Pending Title', status: 'draft' });
	});

	test('clears matching primitives from changes for versioned rooms', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);
		await room.ensureInitialized();

		await room.join(clientA);

		mockData.set(`${uid}:changes`, { title: 'Saved Title', status: 'draft' });

		const onUpdateHandler = vi.mocked(emitter.onAction).mock.calls.find((call) => call[0] === 'versions.update')![1];

		const mockService = {
			readOne: vi.fn().mockResolvedValue({ delta: { title: 'Saved Title', status: 'published' } }),
		};

		vi.mocked(getService).mockReturnValue(mockService as any);

		await onUpdateHandler({ keys: [versionId] }, {} as any);

		const updatedChanges = mockData.get(`${uid}:changes`);

		expect(updatedChanges).toEqual({ status: 'draft' });
	});

	test('disposes version event listeners correctly', () => {
		const item = getTestItem();
		const versionId = randomUUID();
		const uid = getRoomHash('coll', item, versionId);
		const room = new Room(uid, 'coll', item, versionId, {}, mockMessenger);

		room.dispose();

		const offActionCalls = vi.mocked(emitter.offAction).mock.calls;
		const versionsUpdateOff = offActionCalls.find((call) => call[0] === 'versions.update');
		const versionsDeleteOff = offActionCalls.find((call) => call[0] === 'versions.delete');

		expect(versionsUpdateOff).toBeDefined();
		expect(versionsDeleteOff).toBeDefined();
	});
});

describe('getRoomHash', () => {
	test('unique for just collection', () => {
		expect(getRoomHash('abc', null, null)).toEqual(getRoomHash('abc', null, null));
		expect(getRoomHash('abc', null, null)).not.toEqual(getRoomHash('def', null, null));
	});

	test('unique for collection and item', () => {
		expect(getRoomHash('abc', '123', null)).toEqual(getRoomHash('abc', '123', null));
		expect(getRoomHash('abc', '123', null)).not.toEqual(getRoomHash('def', '123', null));
		expect(getRoomHash('abc', '123', null)).not.toEqual(getRoomHash('abc', '456', null));
	});

	test('unique for collection, item and version', () => {
		expect(getRoomHash('abc', '123', 'v1')).toEqual(getRoomHash('abc', '123', 'v1'));
		expect(getRoomHash('abc', '123', 'v1')).not.toEqual(getRoomHash('def', '123', 'v1'));
		expect(getRoomHash('abc', '123', 'v1')).not.toEqual(getRoomHash('abc', '456', 'v1'));
		expect(getRoomHash('abc', '123', 'v1')).not.toEqual(getRoomHash('abc', '123', 'v2'));
	});
});
