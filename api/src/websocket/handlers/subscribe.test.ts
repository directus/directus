import type { Accountability, CollectionsOverview, Relation } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
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

vi.mock('../../services', () => ({
	ItemsService: vi.fn(() => ({
		readByQuery: vi.fn(),
	})),
	MetaService: vi.fn(),
}));

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
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

			// simulate a user without permission to read the collection
			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

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

			// the access check ran and the subscription was not registered
			expect(validateAccess).toBeCalled();
			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should reject event subscription bypass when the user lacks read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			// simulate a user without permission to read the collection
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

			// the access check still ran and the subscription was not registered
			expect(validateAccess).toBeCalled();
			expect(subscribe).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
		});

		test('should allow event subscription when the user has read access', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			// user has permission to read the collection
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

		test('should reject item scoped subscriptions when the item is not accessible', async () => {
			const client = mockClient(mockAccountability());

			mockSchema('test_collection');

			// the user can read the collection, but not this particular item
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
					event: 'delete',
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
		const deleteEvent: WebSocketEvent = {
			action: 'delete',
			collection: 'test_collection',
			keys: ['5'],
		};

		async function subscribeToDeletes(client: WebSocketClient) {
			mockSchema('test_collection');

			await handler.onMessage(client, {
				type: 'subscribe',
				collection: 'test_collection',
				event: 'delete',
				uid: '123',
			} as unknown as WebSocketSubscribeMessage);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
			vi.mocked(client.send).mockClear();
		}

		test('should dispatch delete events to subscribers with read access', async () => {
			const client = mockClient(mockAccountability());
			await subscribeToDeletes(client);

			await handler.dispatch(deleteEvent);

			expect(client.send).toBeCalledWith(
				JSON.stringify({ type: 'subscription', event: 'delete', data: ['5'], uid: '123' }),
			);
		});

		test('should not dispatch delete events once read access has been revoked', async () => {
			const client = mockClient(mockAccountability());
			await subscribeToDeletes(client);

			// the subscription was registered while the user still had access
			vi.mocked(validateAccess).mockRejectedValueOnce(new Error('FORBIDDEN'));

			await handler.dispatch(deleteEvent);

			// no payload, and no error either: an error would leak that the event happened
			expect(client.send).not.toBeCalled();
		});

		test('should re-validate access for every dispatched event', async () => {
			const client = mockClient(mockAccountability());
			await subscribeToDeletes(client);

			vi.mocked(validateAccess).mockClear();

			await handler.dispatch(deleteEvent);
			await handler.dispatch(deleteEvent);

			expect(validateAccess).toBeCalledTimes(2);
		});

		test('should not validate access when access control is disabled', async () => {
			const client = mockClient(null);
			await subscribeToDeletes(client);

			await handler.dispatch(deleteEvent);

			expect(validateAccess).not.toBeCalled();
			expect(client.send).toBeCalled();
		});
	});
});
