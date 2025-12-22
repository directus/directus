import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CollabRooms, getRoomHash, Room } from './room.js';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { sanitizePayload } from './sanitize-payload.js';

import { getService } from '../../../utils/get-service.js';
import { getSchema } from '../../../utils/get-schema.js';

vi.mock('../../../database/index.js', () => ({
	default: vi.fn(() => ({
		select: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		first: vi.fn().mockReturnThis(),
	})),
}));

vi.mock('../../../utils/get-schema.js');
vi.mock('./sanitize-payload.js');
vi.mock('./field-permissions.js');
vi.mock('../../../utils/get-service.js');
vi.mock('../../../permissions/lib/fetch-permissions.js');
vi.mock('../../../permissions/lib/fetch-policies.js');
vi.mock('../../../permissions/utils/extract-required-dynamic-variable-context.js');
vi.mock('../../../permissions/utils/fetch-dynamic-variable-data.js');
vi.mock('../../../permissions/utils/process-permissions.js');

import { permissionCache } from './permissions-cache.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';

const mockMessenger = {
	sendClient: vi.fn(),
	sendRoom: vi.fn(),
	setRoomListener: vi.fn(),
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

afterEach(() => {
	vi.clearAllMocks();
});

beforeEach(() => {
	permissionCache.clear();

	vi.mocked(getService).mockReturnValue({
		readOne: vi.fn().mockResolvedValue({ id: 1, date: '2099-01-01' }),
		readSingleton: vi.fn().mockResolvedValue({}),
	} as any);

	vi.mocked(fetchPolicies).mockResolvedValue(['policy-1']);

	vi.mocked(fetchPermissions).mockResolvedValue([
		{
			fields: ['*'],
			permissions: {},
			validation: {},
		},
	] as any);

	vi.mocked(processPermissions).mockImplementation(({ permissions }) => permissions);
	vi.mocked(fetchDynamicVariableData).mockResolvedValue({});
	vi.mocked(extractRequiredDynamicVariableContextForPermissions).mockReturnValue({} as any);
});

function mockWebSocketClient(client: Partial<WebSocketClient>): WebSocketClient {
	return merge(
		{
			send: vi.fn(),

			uid: 'abc',

			accountability: getAccountability(),

			on: vi.fn(),

			close: vi.fn(),
			terminate: vi.fn(),
		},
		client,
	) as WebSocketClient;
}

let testCounter = 0;
const getTestItem = () => `item_${testCounter++}`;

describe('CollabRooms', () => {
	test('create room', async () => {
		const rooms = new CollabRooms(mockMessenger);

		const room = await rooms.createRoom('a', getTestItem(), null);

		expect(room).toBeDefined();
	});

	test('create room twice', async () => {
		const rooms = new CollabRooms(mockMessenger);
		const item = getTestItem();

		const room = await rooms.createRoom('a', item, null);
		const roomDuplicate = await rooms.createRoom('a', item, null);

		expect(room).toEqual(roomDuplicate);
	});

	test('getRoom', async () => {
		const rooms = new CollabRooms(mockMessenger);

		const room = await rooms.createRoom('a', getTestItem(), null);
		const roomReference = await rooms.getRoom(room.uid);

		expect(room).toEqual(roomReference);
	});

	test('getRoom with invalid id', async () => {
		const rooms = new CollabRooms(mockMessenger);

		await rooms.createRoom('a', getTestItem(), null);
		const room = await rooms.getRoom('invalid');

		expect(room).toBeUndefined();
	});

	test('getClientRooms', async () => {
		const rooms = new CollabRooms(mockMessenger);
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', getTestItem(), null);
		await room.join(client);

		const clientRooms = await rooms.getClientRooms(client);

		expect(clientRooms).toEqual([room]);
	});

	test('cleanupRooms', async () => {
		const rooms = new CollabRooms(mockMessenger);
		const client = mockWebSocketClient({ uid: 'abc' });

		const room = await rooms.createRoom('a', getTestItem(), null);
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
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		expect(room).toBeDefined();
	});

	test('join room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

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
			user: 'Mock User',
			type: 'collab',
			room: uid,
		});
	});

	test('leave room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		await room.leave(clientA);

		expect((await room.getClients()).length).toBe(0);
	});

	test('update field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		await room.join(clientA);
		await room.join(clientB);
		await room.join(clientC);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload, ctx) => {
			if (ctx.accountability?.user === 'Mock User') {
				return payload;
			}

			return {};
		});

		await room.update(clientA, 'id', 5);

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

	test('unset field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: { publish_date: { _lt: '$NOW' } },
				validation: {},
			},
		] as any);

		await room.unset('publish_date');

		expect(
			vi
				.mocked(mockMessenger.sendClient)
				.mock.calls.find((c: any) => c[0] === 'abc' && c[1].action === 'update' && c[1].field === 'publish_date')?.[1],
		).toEqual({
			action: 'update',
			field: 'publish_date',
			type: 'collab',
			room: uid,
		});
	});

	test('save', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		await room.join(clientA);
		await room.join(clientB);

		await room.save(clientB);

		expect(
			vi.mocked(mockMessenger.sendClient).mock.calls.find((c: any) => c[0] === 'abc' && c[1].action === 'save')?.[1],
		).toEqual({
			action: 'save',
			type: 'collab',
			room: uid,
		});
	});

	test('focus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(mockMessenger, uid, 'coll', item, null);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: { publish_date: { _lt: '$NOW' } },
				validation: {},
			},
		] as any);

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

describe('Room.verifyPermissions', () => {
	const item = '1';
	const collection = 'articles';
	const uid = getRoomHash(collection, item, null);
	let room: Room;

	beforeEach(async () => {
		room = new Room(mockMessenger, uid, collection, item, null);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, publish_date: '2025-12-23T10:00:00Z', status: 'draft' }),
			readSingleton: vi.fn().mockResolvedValue({ id: 1, title: 'Settings' }),
		} as any);

		vi.mocked(getSchema).mockResolvedValue({
			collections: {
				articles: {
					collection: 'articles',
					fields: {
						id: { field: 'id', type: 'integer' },
						title: { field: 'title', type: 'string' },
						status: { field: 'status', type: 'string' },
						publish_date: { field: 'publish_date', type: 'datetime' },
						authors: { field: 'authors', type: 'alias' },
					},
				},
				authors: {
					collection: 'authors',
					fields: {
						id: { field: 'id', type: 'integer' },
						name: { field: 'name', type: 'string' },
					},
				},
				settings: {
					collection: 'settings',
					singleton: true,
					fields: {
						id: { field: 'id', type: 'integer' },
						title: { field: 'title', type: 'string' },
					},
				},
			},
			relations: [
				{
					collection: 'articles',
					field: 'authors',
					related_collection: 'authors',
				},
			],
		} as any);
	});

	test('TTL Accuracy ($NOW)', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		// Mock time to 2025-12-22T10:00:00Z
		vi.setSystemTime(new Date('2025-12-22T10:00:00Z'));

		const rawPerms = [
			{
				fields: ['title'],
				permissions: { publish_date: { _gt: '$NOW' } },
				validation: {},
			},
		];

		vi.mocked(fetchPermissions).mockResolvedValue(rawPerms as any);

		vi.mocked(processPermissions).mockReturnValue([
			{
				fields: ['title'],
				permissions: { publish_date: { _gt: new Date('2025-12-22T10:00:00Z') } },
				validation: {},
			},
		] as any);

		// Current time: 10:00:00
		// publish_date: 2025-12-23T10:00:00Z (24 hours in future)
		// Rule: publish_date > $NOW
		// This will flip when $NOW reaches publish_date.
		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		const fields = await room.verifyPermissions(client, collection, item);
		expect(fields).toContain('title');

		expect(spy).toHaveBeenCalledWith(
			expect.anything(),
			collection,
			item,
			'read',
			expect.arrayContaining(['title']),
			expect.anything(),
			3600000, // Capped at 1 hour
		);

		vi.useRealTimers();
	});

	test('Aggregation & Relational Dependencies', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: { 'count(authors)': { _gt: 0 } },
				validation: {},
			},
		] as any);

		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		await room.verifyPermissions(client, collection, item);

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({ user: 'Mock User' }),
			collection,
			item,
			'read',
			['*'],
			['authors'],
			undefined,
		);
	});

	test('Singleton collection handling', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });
		const singletonRoom = new Room(mockMessenger, 'settings-uid', 'settings', null, null);

		const serviceMock = vi.mocked(getService)('settings', {} as any);

		await singletonRoom.verifyPermissions(client, 'settings', null);

		expect(serviceMock.readSingleton).toHaveBeenCalled();
		expect(serviceMock.readOne).not.toHaveBeenCalled();
	});

	test('Permission merging (union of fields)', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { status: { _eq: 'draft' } },
				validation: {},
			},
			{
				fields: ['status'],
				permissions: {}, // Always matches
				validation: {},
			},
		] as any);

		const fields = await room.verifyPermissions(client, collection, item);

		expect(fields).toContain('title');
		expect(fields).toContain('status');
		expect(fields).not.toContain('publish_date');
	});

	test('Admin bypass', async () => {
		const client = mockWebSocketClient({
			uid: 'admin-client',
			accountability: getAccountability({ admin: true }),
		});

		const fields = await room.verifyPermissions(client, collection, item);
		expect(fields).toEqual(['*']);
		expect(fetchPermissions).not.toHaveBeenCalled();
	});

	test('Cache hit skips permission fetch', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		// First call - populates cache
		await room.verifyPermissions(client, collection, item);
		expect(fetchPermissions).toHaveBeenCalledTimes(1);

		// Second call - should hit cache
		await room.verifyPermissions(client, collection, item);
		expect(fetchPermissions).toHaveBeenCalledTimes(1);
	});

	test('Error in verifyPermissions kicks client', async () => {
		const client = mockWebSocketClient({ uid: 'client-fail' });

		vi.mocked(fetchPermissions).mockRejectedValueOnce(new Error('DB Error'));

		const fields = await room.verifyPermissions(client, collection, item);

		expect(fields).toEqual([]);
		expect(client.close).toHaveBeenCalled();
		expect(client.terminate).toHaveBeenCalled();
	});

	test('Deep Relational Dependencies', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: {
					_and: [
						{ status: { _eq: 'published' } },
						{ authors: { name: { _contains: 'John' } } },
					],
				},
				validation: {},
			},
		] as any);

		permissionCache.clear();
		const spy = vi.spyOn(permissionCache, 'set');

		await room.verifyPermissions(client, collection, item);

		const firstCall = spy.mock.calls.find((c) => c[5]?.includes('authors'));
		expect(firstCall).toBeDefined();
		expect(firstCall![5]).toContain('authors');
	});
});
