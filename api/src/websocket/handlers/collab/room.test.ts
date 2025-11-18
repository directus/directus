import { describe, expect, test, vi } from 'vitest';
import { CollabRooms, Room } from './room.js';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';

vi.mock('../../../database/index.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');

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
});
