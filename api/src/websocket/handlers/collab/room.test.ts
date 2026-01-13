import { randomUUID } from 'node:crypto';
import type { WebSocketClient } from '@directus/types';
import { merge } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from '../../../bus/index.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { permissionCache } from './permissions-cache.js';
import { CollabRooms, getRoomHash, Room } from './room.js';
import { sanitizePayload } from './sanitize-payload.js';

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
vi.mock('../../../permissions/modules/validate-access/lib/validate-item-access.js');

const mockMessenger = {
	sendClient: vi.fn(),
	sendRoom: vi.fn(),
	setRoomListener: vi.fn(),
	addClient: vi.fn(),
	removeClient: vi.fn(),
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

	vi.mocked(getSchema).mockResolvedValue({
		collections: {
			coll: { primary: 'id', singleton: false, fields: {} },
			articles: { primary: 'id', singleton: false, fields: {} },
		},
		relations: [],
	} as any);

	vi.mocked(validateItemAccess).mockResolvedValue({
		accessAllowed: true,
		allowedRootFields: ['*'],
	});
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

	test('getRoom for uid', async () => {
		const rooms = new CollabRooms(mockMessenger);

		const item = getTestItem();
		await rooms.createRoom('a', item, null);
		const room = await rooms.getRoom(getRoomHash('a', item, null));

		expect(room).toBeDefined();
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

		// Advance time past the 1 minute inactivity threshold
		vi.useFakeTimers();
		vi.setSystemTime(Date.now() + 61 * 1000);

		await rooms.cleanupRooms();

		expect(Object.keys(rooms.rooms).length).toEqual(0);

		vi.useRealTimers();
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

	test('leave room', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		await room.join(clientA);

		expect((await room.getClients()).length).toBe(1);

		await room.leave(clientA);

		expect((await room.getClients()).length).toBe(0);
	});

	test('leave room clears focus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		await room.join(clientA);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: {},
				validation: {},
			},
		] as any);

		await room.focus(clientA, 'title');
		expect(await room.getFocusByUser('abc')).toBe('title');

		await room.leave(clientA);

		expect(await room.getFocusByUser('abc')).toBeUndefined();
	});

	test('update field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const clientC = mockWebSocketClient({ uid: 'hij' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		await room.join(clientA);
		await room.join(clientB);
		await room.join(clientC);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload, ctx) => {
			if (
				ctx.accountability?.user === 'user-abc' ||
				ctx.accountability?.user === 'user-def' ||
				ctx.accountability?.user === 'user-hij'
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

	test('unset field', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: { publish_date: { _lt: '$NOW' } },
				validation: {},
			},
		] as any);

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

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload) => payload);

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

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(sanitizePayload).mockImplementation(async (_, payload) => payload);

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

	test('focus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

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

	test('checkFocus', async () => {
		const clientA = mockWebSocketClient({ uid: 'abc' });
		const clientB = mockWebSocketClient({ uid: 'def' });
		const item = getTestItem();
		const uid = getRoomHash('coll', item, null);
		const room = new Room(uid, 'coll', item, null, {}, mockMessenger);

		await room.join(clientA);
		await room.join(clientB);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: {},
				validation: {},
			},
		] as any);

		// Client A focuses on title
		await room.focus(clientA, 'title');

		// Client A checks focus on title
		const checkA = await room.getFocusByUser('abc');
		expect(checkA).toBe('title');

		// Client B checks focus on title
		const checkB = await room.getFocusByUser('def');
		expect(checkB).toBeUndefined();
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
		room = new Room(uid, collection, item, null, {}, mockMessenger);

		vi.mocked(getService).mockReturnValue({
			readOne: vi.fn().mockResolvedValue({ id: 1, publish_date: '2025-12-23T10:00:00Z', status: 'draft' }),
			readSingleton: vi.fn().mockResolvedValue({ id: 1, title: 'Settings' }),
		} as any);

		vi.mocked(getSchema).mockResolvedValue({
			collections: {
				articles: {
					collection: 'articles',
					primary: 'id',
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
					primary: 'id',
					fields: {
						id: { field: 'id', type: 'integer' },
						name: { field: 'name', type: 'string' },
					},
				},
				settings: {
					collection: 'settings',
					singleton: true,
					primary: 'id',
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

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title'],
		});

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
			expect.objectContaining({ user: 'user-client-1' }),
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
		const singletonRoom = new Room('settings-uid', 'settings', null, null, {}, mockMessenger);

		const serviceMock = vi.mocked(getService)('settings', {} as any);

		await singletonRoom.verifyPermissions(client, 'settings', null);

		expect(serviceMock.readSingleton).toHaveBeenCalled();
		expect(serviceMock.readOne).not.toHaveBeenCalled();
	});

	test('Singleton with item rules returns allowed fields', async () => {
		const client = mockWebSocketClient({ uid: 'client-restricted' });
		const singletonRoom = new Room('settings-uid', 'settings', null, null, {}, mockMessenger);

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { title: { _eq: 'Settings' } },
				validation: {},
			},
		] as any);

		vi.mocked(processPermissions).mockReturnValue([
			{
				fields: ['title'],
				permissions: { title: { _eq: 'Settings' } },
				validation: {},
			},
		] as any);

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title'],
		});

		permissionCache.clear();
		const fields = await singletonRoom.verifyPermissions(client, 'settings', null);

		expect(fields).toContain('title');
		expect(fields.length).toBeGreaterThan(0);
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

		vi.mocked(validateItemAccess).mockResolvedValue({
			accessAllowed: true,
			allowedRootFields: ['title', 'status'],
		});

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

	test('Error in verifyPermissions returns empty fields', async () => {
		const client = mockWebSocketClient({ uid: 'client-fail' });

		vi.mocked(fetchPermissions).mockRejectedValueOnce(new Error('DB Error'));

		const fields = await room.verifyPermissions(client, collection, item);

		expect(fields).toEqual([]);
		expect(client.close).not.toHaveBeenCalled();
		expect(client.terminate).not.toHaveBeenCalled();
	});

	test('Deep Relational Dependencies', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });

		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['*'],
				permissions: {
					_and: [{ status: { _eq: 'published' } }, { authors: { name: { _contains: 'John' } } }],
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

describe('PermissionCache Invalidation', () => {
	test('Schema change invalidates cache', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });
		const room = new Room('test-uid', 'articles', '1', null, {}, mockMessenger);

		// Populate cache
		await room.verifyPermissions(client, 'articles', '1');
		expect(permissionCache.get(client.accountability!, 'articles', '1', 'read')).toBeDefined();

		// Trigger schema change invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_fields' });

		// Cache should be cleared
		expect(permissionCache.get(client.accountability!, 'articles', '1', 'read')).toBeUndefined();
	});

	test('Collection metadata change invalidates cache', async () => {
		const client = mockWebSocketClient({ uid: 'client-1' });
		const room = new Room('test-uid', 'articles', '1', null, {}, mockMessenger);

		// Populate cache
		await room.verifyPermissions(client, 'articles', '1');
		expect(permissionCache.get(client.accountability!, 'articles', '1', 'read')).toBeDefined();

		// Trigger collection metadata change invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_collections' });

		// Cache should be cleared
		expect(permissionCache.get(client.accountability!, 'articles', '1', 'read')).toBeUndefined();
	});

	test('Race condition protection in verifyPermissions', async () => {
		const client = mockWebSocketClient({ uid: 'client-race' });
		const room = new Room('race-uid', 'articles', '1', null, {}, mockMessenger);

		// Mock a slow permission fetch
		vi.mocked(fetchPermissions).mockImplementationOnce(async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
			return [{ fields: ['title'], permissions: {}, validation: {} }] as any;
		});

		permissionCache.clear();
		const setSpy = vi.spyOn(permissionCache, 'set');

		// Start permission verification
		const verifyPromise = room.verifyPermissions(client, 'articles', '1');

		// Immediately trigger an invalidation
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'articles', keys: ['1'] });

		await verifyPromise;

		// Should NOT have called set because invalidationCount changed
		expect(setSpy).not.toHaveBeenCalled();
	});

	test('User-specific dependency invalidation', async () => {
		const clientA = mockWebSocketClient({ uid: 'user-a', accountability: getAccountability({ user: 'user-a' }) });
		const clientB = mockWebSocketClient({ uid: 'user-b', accountability: getAccountability({ user: 'user-b' }) });
		const room = new Room('test-uid', 'articles', '1', null, {}, mockMessenger);

		// Mock a permission that depends on $CURRENT_USER property
		vi.mocked(fetchPermissions).mockResolvedValue([
			{
				fields: ['title'],
				permissions: { department: { _eq: '$CURRENT_USER.department' } },
				validation: {},
			},
		] as any);

		permissionCache.clear();

		// Populate cache for both users
		await room.verifyPermissions(clientA, 'articles', '1');
		await room.verifyPermissions(clientB, 'articles', '1');

		expect(permissionCache.get(clientA.accountability!, 'articles', '1', 'read')).toBeDefined();
		expect(permissionCache.get(clientB.accountability!, 'articles', '1', 'read')).toBeDefined();

		// Trigger invalidation for user A ONLY
		const bus = useBus();
		await bus.publish('websocket.event', { collection: 'directus_users', key: 'user-a' });

		// Cache for user A should be cleared, but user B should remain
		expect(permissionCache.get(clientA.accountability!, 'articles', '1', 'read')).toBeUndefined();
		expect(permissionCache.get(clientB.accountability!, 'articles', '1', 'read')).toBeDefined();
	});

	test('LRU eviction when max size is reached', async () => {
		// Create a small cache with max size of 3
		const { PermissionCache } = await import('./permissions-cache.js');
		const smallCache = new PermissionCache(3);

		const accountability = getAccountability({ user: 'test-user' });

		// Add 3 entries
		smallCache.set(accountability, 'coll', 'item1', 'read', ['field1']);
		smallCache.set(accountability, 'coll', 'item2', 'read', ['field2']);
		smallCache.set(accountability, 'coll', 'item3', 'read', ['field3']);

		// All 3 should be present
		expect(smallCache.get(accountability, 'coll', 'item1', 'read')).toEqual(['field1']);
		expect(smallCache.get(accountability, 'coll', 'item2', 'read')).toEqual(['field2']);
		expect(smallCache.get(accountability, 'coll', 'item3', 'read')).toEqual(['field3']);

		// Access item1 to make it most recently used
		smallCache.get(accountability, 'coll', 'item1', 'read');

		// Add a 4th entry - should evict item2 (the least recently used after accessing item1)
		smallCache.set(accountability, 'coll', 'item4', 'read', ['field4']);

		// item1 should still be present (was accessed), item2 should be evicted
		expect(smallCache.get(accountability, 'coll', 'item1', 'read')).toEqual(['field1']);
		expect(smallCache.get(accountability, 'coll', 'item2', 'read')).toBeUndefined();
		expect(smallCache.get(accountability, 'coll', 'item3', 'read')).toEqual(['field3']);
		expect(smallCache.get(accountability, 'coll', 'item4', 'read')).toEqual(['field4']);
	});
});
