import type { Accountability, CollectionsOverview, Relation } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import { ItemsService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { WebSocketEvent, WebSocketSubscribeMessage } from '../messages.js';
import type { WebSocketClient } from '../types.js';
import { SubscribeHandler } from './subscribe.js';

// mocking
vi.mock('../controllers', () => ({
	getWebSocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));

vi.mock('../../utils/get-schema', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../services', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return { ...mockItemsService(), FieldsService: vi.fn(), MetaService: vi.fn() };
});

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([{ permissions: null }]),
}));

vi.mock('../../database/index');

function mockClient(accountability: Accountability | null = null) {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability,
	} as unknown as WebSocketClient;
}

function mockAccountability(overrides: Partial<Accountability> = {}): Accountability {
	return {
		role: null,
		user: null,
		roles: [],
		admin: false,
		app: false,
		ip: null,
		...overrides,
	};
}

function mockSchema(...collections: string[]) {
	vi.mocked(getSchema).mockImplementation(async () => ({
		collections: Object.fromEntries(
			collections.map((collection) => [
				collection,
				{
					collection,
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			]),
		) as CollectionsOverview,
		relations: [] as Relation[],
	}));
}

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

describe('WebSocket subscribe handler', () => {
	let handler: SubscribeHandler;

	beforeEach(() => {
		// initialize handler
		handler = new SubscribeHandler();
	});

	afterEach(() => {
		emitter.offAll();
		vi.clearAllMocks();
	});

	test('ignore other message types', async () => {
		const spy = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction('websocket.message', {
			client: mockClient(),
			message: { type: 'ping' },
		});

		// expect nothing
		expect(spy).not.toBeCalled();
	});

	test('should fail subscribe to non-existing collection', async () => {
		mockSchema();

		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction('websocket.message', {
			client: mockClient(),
			message: {
				type: 'subscribe',
				collection: 'does_not_exist',
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalled();
		expect(subscribe).not.toBeCalled();
	});

	test('should fail to subscribe to an inactive collection', async () => {
		// an admin is told the collection is inactive without a permission lookup
		const client = mockClient(mockAccountability({ admin: true }));

		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {
				test_collection: {
					collection: 'test_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					status: 'inactive',
					fields: {},
				},
			} as CollectionsOverview,
			relations: [] as Relation[],
		}));

		const subscribe = vi.spyOn(handler, 'subscribe');

		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'test_collection',
				uid: '123',
			},
		});

		await delay(10);

		expect(subscribe).not.toBeCalled();
		expect(handler.subscriptions['test_collection']).toBeUndefined();
		expect(client.send).toBeCalledWith(expect.stringContaining('COLLECTION_INACTIVE'));
		expect(client.send).toBeCalledWith(expect.stringContaining('"uid":"123"'));
	});

	test('should fail to subscribe to a collection that is not on the schema', async () => {
		const client = mockClient(mockAccountability({ admin: true }));

		mockSchema();

		const subscribe = vi.spyOn(handler, 'subscribe');

		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'test_collection',
				uid: '123',
			},
		});

		await delay(10);

		expect(subscribe).not.toBeCalled();
		expect(handler.subscriptions['test_collection']).toBeUndefined();
		expect(client.send).toBeCalledWith(expect.stringContaining('FORBIDDEN'));
		expect(client.send).toBeCalledWith(expect.stringContaining('"uid":"123"'));
	});

	test('should subscribe/unsubscribe to collection', async () => {
		const client = mockClient();

		mockSchema('test_collection');

		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'test_collection',
				uid: '123',
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalled();
		expect(subscribe).toBeCalled();
		expect(handler.subscriptions['test_collection']?.size).toBe(1);
	});

	test('unsubscribe a specific subscription', async () => {
		const client = mockClient();

		mockSchema('test_collection', 'other_collection');

		const unsubscribe = vi.spyOn(handler, 'unsubscribe');
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');

		// subscribe
		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'test_collection',
				uid: '123',
			},
		});

		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'other_collection',
				uid: '456',
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalledTimes(2);
		expect(subscribe).toBeCalledTimes(2);
		expect(handler.subscriptions['test_collection']?.size).toBe(1);
		expect(handler.subscriptions['other_collection']?.size).toBe(1);

		// unsubscribe
		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'unsubscribe',
				uid: '123',
			},
		});

		await delay(10);

		// expect
		expect(unsubscribe).toBeCalled();
		expect(handler.subscriptions['test_collection']?.size).toBe(0);
		expect(handler.subscriptions['other_collection']?.size).toBe(1);
	});

	test('unsubscribe all subscriptions', async () => {
		const client = mockClient();

		mockSchema('test_collection', 'other_collection');

		const unsubscribe = vi.spyOn(handler, 'unsubscribe');
		const subscribe = vi.spyOn(handler, 'subscribe');
		const onMessage = vi.spyOn(handler, 'onMessage');

		// subscribe
		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'test_collection',
				uid: '123',
			},
		});

		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'subscribe',
				collection: 'other_collection',
				uid: '456',
			},
		});

		await delay(10);

		// expect
		expect(onMessage).toBeCalledTimes(2);
		expect(subscribe).toBeCalledTimes(2);
		expect(handler.subscriptions['test_collection']?.size).toBe(1);
		expect(handler.subscriptions['other_collection']?.size).toBe(1);

		// unsubscribe
		emitter.emitAction('websocket.message', {
			client,
			message: {
				type: 'unsubscribe',
			},
		});

		await delay(10);

		// expect
		expect(unsubscribe).toBeCalled();
		expect(handler.subscriptions['test_collection']?.size).toBe(0);
		expect(handler.subscriptions['other_collection']?.size).toBe(0);
	});

	describe('access control on subscribe', () => {
		test('should reject subscription when the user lacks read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(ItemsService.prototype.readByQuery).mockRejectedValueOnce(new Error('FORBIDDEN'));

			const subscribe = vi.spyOn(handler, 'subscribe');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					uid: '123',
				},
			});

			await delay(10);

			// reading the initial payload is the access check, no separate one is needed
			expect(validateAccess).not.toBeCalled();
			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should reject event subscription bypass when the user lacks read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

			const subscribe = vi.spyOn(handler, 'subscribe');

			// the "event" field previously skipped the permission probe entirely
			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'delete',
					uid: '123',
				},
			});

			await delay(10);

			expect(validateAccess).toBeCalled();
			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should allow event subscription when the user has read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(validateAccess).mockResolvedValueOnce(undefined);

			const subscribe = vi.spyOn(handler, 'subscribe');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'delete',
					uid: '123',
				},
			});

			await delay(10);

			expect(validateAccess).toBeCalled();
			expect(subscribe).toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should skip the access check when access control is disabled', async () => {
			const client = mockClient(null);

			mockSchema('test_collection');

			const subscribe = vi.spyOn(handler, 'subscribe');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'delete',
					uid: '123',
				},
			});

			await delay(10);

			expect(validateAccess).not.toBeCalled();
			expect(subscribe).toBeCalled();
		});

		test('should validate access to the item for item scoped subscriptions', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'delete',
					item: 5,
					uid: '123',
				},
			});

			await delay(10);

			expect(validateAccess).toBeCalledWith(
				expect.objectContaining({
					action: 'read',
					collection: 'test_collection',
					primaryKeys: ['5'],
				}),
				expect.anything(),
			);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should validate access to the item for item scoped update subscriptions', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'update',
					item: 5,
					uid: '123',
				},
			});

			await delay(10);

			expect(validateAccess).toBeCalledWith(
				expect.objectContaining({ action: 'read', collection: 'test_collection', primaryKeys: ['5'] }),
				expect.anything(),
			);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should allow item scoped create subscriptions for an item that does not exist yet', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'create',
					item: 'future_id',
					uid: '123',
				},
			});

			await delay(10);

			// only the collection is validated, the created item is read with the user's permissions on dispatch
			expect(validateAccess).toBeCalledWith(
				expect.not.objectContaining({ primaryKeys: expect.anything() }),
				expect.anything(),
			);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should reject create subscriptions when the user lacks read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

			const subscribe = vi.spyOn(handler, 'subscribe');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'create',
					item: 'future_id',
					uid: '123',
				},
			});

			await delay(10);

			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should reject item scoped subscriptions when the item is not accessible', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

			const subscribe = vi.spyOn(handler, 'subscribe');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'test_collection',
					event: 'delete',
					item: 5,
					uid: '123',
				},
			});

			await delay(10);

			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should only validate collection access for collections without item access control', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('directus_collections');

			emitter.emitAction('websocket.message', {
				client,
				message: {
					type: 'subscribe',
					collection: 'directus_collections',
					event: 'update',
					item: 'some_collection',
					uid: '123',
				},
			});

			await delay(10);

			// `CollectionsService` has no item level access control to validate against
			expect(validateAccess).toBeCalledWith(
				expect.not.objectContaining({ primaryKeys: expect.anything() }),
				expect.anything(),
			);

			expect(handler.subscriptions['directus_collections']?.size).toBe(1);
		});

		test.each(['directus_collections', 'directus_fields'])(
			'should reject delete subscriptions to "%s" for non-admins',
			async (collection) => {
				const client = mockClient(mockAccountability());

				mockSchema(collection);

				await handler.onMessage(client, {
					type: 'subscribe',
					collection,
					event: 'delete',
					uid: '123',
				} as unknown as WebSocketSubscribeMessage);

				// their permissions are removed along with the deleted items, so read access can't be verified
				expect(handler.subscriptions[collection]?.size).toBeFalsy();
				expect(client.send).toBeCalledWith(expect.stringContaining('FORBIDDEN'));
			},
		);

		test('should reject collection wide delete subscriptions when read access is limited by row rules', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			vi.mocked(fetchPermissions).mockResolvedValueOnce([{ permissions: { owner: { _eq: 'me' } } } as any]);

			await handler.onMessage(client, {
				type: 'subscribe',
				collection: 'test_collection',
				event: 'delete',
				uid: '123',
			} as unknown as WebSocketSubscribeMessage);

			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
			expect(client.send).toBeCalledWith(expect.stringContaining('FORBIDDEN'));
		});

		test('should validate item scoped delete subscriptions against the item instead of the row rules', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			await handler.onMessage(client, {
				type: 'subscribe',
				collection: 'test_collection',
				event: 'delete',
				item: 5,
				uid: '123',
			} as unknown as WebSocketSubscribeMessage);

			// the item itself is validated against the row rules instead
			expect(validateAccess).toBeCalledWith(expect.objectContaining({ primaryKeys: ['5'] }), expect.anything());
			expect(fetchPermissions).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should keep an existing subscription when a rejected one reuses its uid', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			const message = {
				type: 'subscribe',
				collection: 'test_collection',
				event: 'delete',
				uid: '123',
			} as unknown as WebSocketSubscribeMessage;

			await handler.onMessage(client, message);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);

			// access is revoked before the client re-subscribes under the same uid
			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

			await handler.onMessage(client, message);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});
	});

	describe('access control on dispatch', () => {
		const events = {
			create: { action: 'create', collection: 'test_collection', key: '5' },
			update: { action: 'update', collection: 'test_collection', keys: ['5'] },
			delete: { action: 'delete', collection: 'test_collection', keys: ['5'] },
		} satisfies Record<string, WebSocketEvent>;

		const deleteEvent = events.delete;

		async function subscribeTo(client: WebSocketClient, event: keyof typeof events) {
			mockSchema('test_collection');

			await handler.onMessage(client, {
				type: 'subscribe',
				collection: 'test_collection',
				event,
				uid: '123',
			} as unknown as WebSocketSubscribeMessage);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
			vi.mocked(client.send).mockClear();
		}

		test('should dispatch delete events to subscribers with read access', async () => {
			const client = mockClient(mockAccountability());
			await subscribeTo(client, 'delete');

			await handler.dispatch(deleteEvent);

			expect(client.send).toBeCalledWith(
				JSON.stringify({ type: 'subscription', event: 'delete', data: ['5'], uid: '123' }),
			);
		});

		test.each(['create', 'update'] as const)(
			'should dispatch %s events read with the permissions of the subscriber',
			async (action) => {
				const accountability = mockAccountability();
				const client = mockClient(accountability);
				await subscribeTo(client, action);

				vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([{ id: '5' }]);

				await handler.dispatch(events[action]);

				expect(ItemsService).toHaveBeenLastCalledWith('test_collection', expect.objectContaining({ accountability }));
				expect(ItemsService.prototype.readMany).toBeCalledWith(['5'], {});

				expect(client.send).toBeCalledWith(
					JSON.stringify({ type: 'subscription', event: action, data: [{ id: '5' }], uid: '123' }),
				);
			},
		);

		test.each(['create', 'update', 'delete'] as const)(
			'should not dispatch %s events once read access has been revoked',
			async (action) => {
				const client = mockClient(mockAccountability());
				await subscribeTo(client, action);

				// the subscription was registered while the user still had access
				vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

				await handler.dispatch(events[action]);

				// no payload, and no error either: an error would leak that the event happened
				expect(ItemsService.prototype.readMany).not.toBeCalled();
				expect(client.send).not.toBeCalled();
			},
		);

		test('should not dispatch collection wide delete events once read access is limited by row rules', async () => {
			const client = mockClient(mockAccountability());
			await subscribeTo(client, 'delete');

			vi.mocked(fetchPermissions).mockResolvedValueOnce([{ permissions: { owner: { _eq: 'me' } } } as any]);

			await handler.dispatch(deleteEvent);

			expect(client.send).not.toBeCalled();
		});

		test('should dispatch item scoped delete events without checking row rules', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');
			handler.subscribe({ client, collection: 'test_collection', event: 'delete', item: '5', uid: '123' });

			await handler.dispatch(deleteEvent);

			// the item was validated against the row rules when subscribing
			expect(fetchPermissions).not.toBeCalled();

			expect(client.send).toBeCalledWith(
				JSON.stringify({ type: 'subscription', event: 'delete', data: '5', uid: '123' }),
			);
		});

		test('should not dispatch field delete events to non-admins', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('directus_fields');
			handler.subscribe({ client, collection: 'directus_fields', uid: '123' });

			await handler.dispatch({ action: 'delete', collection: 'directus_fields', keys: [1] });

			expect(client.send).not.toBeCalled();
		});

		test('should re-validate access for every dispatched event', async () => {
			const client = mockClient(mockAccountability());
			await subscribeTo(client, 'delete');

			vi.mocked(validateAccess).mockClear();

			await handler.dispatch(deleteEvent);
			await handler.dispatch(deleteEvent);

			expect(validateAccess).toBeCalledTimes(2);
		});

		test('should not validate access when access control is disabled', async () => {
			const client = mockClient(null);
			await subscribeTo(client, 'delete');

			await handler.dispatch(deleteEvent);

			expect(validateAccess).not.toBeCalled();
			expect(client.send).toBeCalled();
		});
	});
});
