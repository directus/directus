import { afterEach, describe, expect, test, vi } from 'vitest';
import { CollabRooms, getRoomHash, Room } from './room.js';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';
import { sanitizePayload } from './sanitize-payload.js';
import { hasFieldPermision } from './field-permissions.js';
import { randomUUID } from 'node:crypto';

vi.mock('../../../database/index.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');
vi.mock('./field-permissions.js');
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

function mockWebSocketClient(client: Partial<WebSocketClient>): WebSocketClient {
	const uid = client.uid || randomUUID();

	return merge(
		{
			send: vi.fn(),
			uid,
			accountability: {
				user: `user-${uid}`,
			},
			on: vi.fn(),
		},
		client,
	) as WebSocketClient;
}

describe('CollabRooms', () => {
	test('create room', async () => {
		const rooms = new CollabRooms();

		const room = await rooms.createRoom('a', '1', null);

		expect(room).toBeDefined();
	});

	test('create room twice', async () => {
		const rooms = new CollabRooms();

		const room = await rooms.createRoom('a', '1', null);
		const roomDuplicate = await rooms.createRoom('a', '1', null);

		expect(room).toEqual(roomDuplicate);
	});

	test('getRoom', async () => {
		const rooms = new CollabRooms();

		const room = await rooms.createRoom('a', '1', null);
		const roomReference = await rooms.getRoom(room.uid);

		expect(room).toEqual(roomReference);
	});

	test('getRoom with invalid id', async () => {
		const rooms = new CollabRooms();

		await rooms.createRoom('a', '1', null);
		const room = await rooms.getRoom('invalid');

		expect(room).toBeUndefined();
	});

	test('getRoom for uid', async () => {
		const rooms = new CollabRooms();

		await rooms.createRoom('a', '1', null);
		const room = await rooms.getRoom(getRoomHash('a', '1', null));

		expect(room).toBeDefined();
	});

	test('getClientRooms', async () => {
		const rooms = new CollabRooms();
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', '1', null);
		await room.join(client);

		const clientRooms = await rooms.getClientRooms(client);

		expect(clientRooms).toEqual([room]);
	});

	test('cleanupRooms', async () => {
		const rooms = new CollabRooms();
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', '1', null);
		await room.join(client);

		await rooms.cleanupRooms();

		expect(Object.keys(rooms.rooms).length).toEqual(1);

		await room.leave(client);

		await rooms.cleanupRooms();

		expect(Object.keys(rooms.rooms).length).toEqual(0);
	});
});

describe('room', () => {
	test('create room', () => {
		const room = new Room('room1', 'coll', '1', null);

		expect(room).toBeDefined();
	});

	test('join room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		expect(clientA.send).toHaveBeenCalledOnce();

		expect(JSON.parse(vi.mocked(clientA.send).mock.lastCall![0] as string)).toEqual({
			action: 'init',
			collection: 'coll',
			item: '1',
			version: null,
			focuses: {},
			connection: 'abc',
			users: [{ user: 'user-abc', connection: 'abc', color: expect.anything() }],
			type: 'collab',
			room: 'room1',
		});

		await room.join(clientB);

		expect((await room.getClients()).length).toBe(2);

		expect(await room.hasClient('abc')).toBeTruthy();
		expect(await room.hasClient('def')).toBeTruthy();
		expect(await room.hasClient('hij')).toBeFalsy();

		// Init and join message
		expect(clientA.send).toHaveBeenCalledTimes(2);

		expect(JSON.parse(vi.mocked(clientA.send).mock.lastCall![0] as string)).toEqual({
			action: 'join',
			connection: 'def',
			color: expect.anything(),
			user: 'user-def',
			type: 'collab',
			room: 'room1',
		});

		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
	});

	test('leave room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		await room.leave(clientA);

		expect((await room.getClients()).length).toBe(0);
	});

	test('update field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);
		await room.join(clientC);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload, ctx) => {
			if (
				ctx.accountability === clientA.accountability ||
				ctx.accountability === clientB.accountability ||
				ctx.accountability === clientC.accountability
			) {
				return payload;
			}

			return {};
		});

		await room.update(clientA, { id: 5 });

		expect(clientC.send).toHaveBeenCalledTimes(2);

		expect(JSON.parse(vi.mocked(clientC.send).mock.lastCall![0] as string)).toEqual({
			action: 'update',
			field: 'id',
			changes: 5,
			type: 'collab',
			room: 'room1',
		});

		// Init, join and update message
		expect(clientB.send).toHaveBeenCalledTimes(3);
	});

	test('unset field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(hasFieldPermision).mockImplementation(async (accountability) => {
			if (accountability === clientA.accountability) {
				return true;
			}

			return false;
		});

		await room.unset(clientA, 'id');

		expect(JSON.parse(vi.mocked(clientA.send).mock.calls[1]![0] as string)).toEqual({
			action: 'join',
			connection: 'def',
			color: expect.anything(),
			user: 'user-def',
			type: 'collab',
			room: 'room1',
		});

		// Init and join message
		expect(clientA.send).toHaveBeenCalledTimes(2);

		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
	});

	test('save', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);

		await room.save(clientB);

		expect(JSON.parse(vi.mocked(clientA.send).mock.lastCall![0] as string)).toEqual({
			action: 'save',
			type: 'collab',
			room: 'room1',
		});

		// Init, join and save message
		expect(clientA.send).toHaveBeenCalledTimes(3);

		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
	});

	test('focus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(hasFieldPermision).mockImplementation(async (accountability) => {
			if (accountability === clientA.accountability) {
				return true;
			}

			return false;
		});

		await room.focus(clientA, 'id');

		expect(JSON.parse(vi.mocked(clientA.send).mock.lastCall![0] as string)).toEqual({
			action: 'join',
			connection: 'def',
			color: expect.anything(),
			user: 'user-def',
			type: 'collab',
			room: 'room1',
		});

		// Init and join message
		expect(clientA.send).toHaveBeenCalledTimes(2);

		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
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
