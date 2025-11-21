import { afterEach, describe, expect, test, vi } from 'vitest';
import { CollabRooms, getRoomHash, Room } from './room.js';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';
import { sanitizePayload } from './sanitize-payload.js';
import { hasFieldPermision } from './field-permissions.js';

vi.mock('../../../database/index.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');
vi.mock('./field-permissions.js');

afterEach(() => {
	vi.clearAllMocks();
});

function mockWebSocketClient(client: Partial<WebSocketClient>): WebSocketClient {
	return merge(
		{
			send: vi.fn(),
			uid: 'abc',
			accountability: {
				user: 'Mock User',
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
		const roomReference = rooms.getRoom(room.uid);

		expect(room).toEqual(roomReference);
	});

	test('getRoom with invalid id', async () => {
		const rooms = new CollabRooms();

		await rooms.createRoom('a', '1', null);
		const room = rooms.getRoom('invalid');

		expect(room).toBeUndefined();
	});

	test('getRoom for uid', async () => {
		const rooms = new CollabRooms();

		const room = await rooms.createRoom('a', '1', null);
		const roomReference = rooms.getRoom(room.uid);

		expect(room).toEqual(roomReference);
	});

	test('getClientRooms', async () => {
		const rooms = new CollabRooms();
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', '1', null);
		room.join(client);

		const clientRooms = rooms.getClientRooms(client);

		expect(clientRooms).toEqual([room]);
	});

	test('cleanupRooms', async () => {
		const rooms = new CollabRooms();
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', '1', null);
		room.join(client);

		rooms.cleanupRooms();

		expect(Object.keys(rooms.rooms).length).toEqual(1);

		room.leave(client);

		rooms.cleanupRooms();

		expect(Object.keys(rooms.rooms).length).toEqual(0);
	});
});

describe('room', () => {
	test('create room', () => {
		const room = new Room('abc', 'coll', '1', null);

		expect(room).toBeDefined();
	});

	test('join room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);

		expect(room.clients.length).toBe(1);

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
			action: 'init',
			collection: 'coll',
			item: '1',
			version: null,
			focuses: {},
			connection: 'abc',
			users: [{ user: 'Mock User', connection: 'abc', color: expect.anything() }],
			type: 'collab',
			room: 'room1',
		});

		await room.join(clientB);

		expect(room.clients.length).toBe(2);

		expect(room.hasClient(clientA)).toBeTruthy();
		expect(room.hasClient(clientB)).toBeTruthy();
		expect(room.hasClient(clientC)).toBeFalsy();

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
			action: 'join',
			connection: 'def',
			color: expect.anything(),
			user: 'Mock User',
			type: 'collab',
			room: 'room1',
		});
	});

	test('leave room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);

		expect(room.clients.length).toBe(1);

		room.leave(clientA);

		expect(room.clients.length).toBe(0);
	});

	test('update field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload, ctx) => {
			if (ctx.accountability === clientA.accountability) {
				return payload;
			}

			return {};
		});

		await room.update('id', 5);

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
			action: 'update',
			field: 'id',
			changes: 5,
			type: 'collab',
			room: 'room1',
		});

		// Init, join and update message
		expect(clientA.send).toHaveBeenCalledTimes(3);
		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
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

		await room.unset('id');

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
			action: 'update',
			field: 'id',
			type: 'collab',
			room: 'room1',
		});

		// Init, join and update message
		expect(clientA.send).toHaveBeenCalledTimes(3);
		// Only the init message should have been send
		expect(clientB.send).toHaveBeenCalledOnce();
	});

	test('save', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const room = new Room('room1', 'coll', '1', null);

		await room.join(clientA);
		await room.join(clientB);

		room.save(clientB);

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
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

		expect(JSON.parse(String(vi.mocked(clientA.send).mock.lastCall?.[0]))).toEqual({
			action: 'focus',
			field: 'id',
			connection: 'abc',
			type: 'collab',
			room: 'room1',
		});

		// Init, join and focus message
		expect(clientA.send).toHaveBeenCalledTimes(3);
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
