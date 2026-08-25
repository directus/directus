import type { CollectionsOverview, Relation } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { getSchema } from '../../utils/get-schema.js';
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

vi.mock('../../database/index');

function adminClient() {
	const client = mockClient();

	// An admin is told the collection is inactive without a permission lookup, which keeps this test
	// away from the database
	(client as { accountability: unknown }).accountability = { admin: true, roles: [], user: null };

	return client;
}

function mockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability: null,
	} as unknown as WebSocketClient;
}

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

describe('WebSocket heartbeat handler', () => {
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
		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {} as CollectionsOverview,
			relations: [] as Relation[],
		}));

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

		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {
				test_collection: {
					collection: 'test_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			} as CollectionsOverview,
			relations: [] as Relation[],
		}));

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

		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {
				test_collection: {
					collection: 'test_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
				other_collection: {
					collection: 'other_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			} as CollectionsOverview,
			relations: [] as Relation[],
		}));

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

		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {
				test_collection: {
					collection: 'test_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
				other_collection: {
					collection: 'other_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			} as CollectionsOverview,
			relations: [] as Relation[],
		}));

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

	test('should fail to subscribe to an inactive collection', async () => {
		const client = adminClient();

		vi.mocked(getSchema).mockImplementation(async () => ({
			collections: {
				test_collection: {
					collection: 'test_collection',
					primary: 'id',
					singleton: false,
					sortField: null,
					note: null,
					accountability: null,
					fields: {},
				},
			} as CollectionsOverview,
			relations: [] as Relation[],
			inactiveCollections: ['test_collection'],
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
	});

	test('should stop dispatching to a subscription once the collection goes inactive', async () => {
		const client = adminClient();

		const collections = {
			test_collection: {
				collection: 'test_collection',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {},
			},
		} as CollectionsOverview;

		handler.subscribe({ client, collection: 'test_collection', event: 'delete', uid: '123' });

		// A delete event hands back the keys without reading through a service, so nothing else would
		// catch the collection being inactive
		vi.mocked(getSchema).mockImplementation(async () => ({
			collections,
			relations: [] as Relation[],
			inactiveCollections: ['test_collection'],
		}));

		await handler.dispatch({ action: 'delete', collection: 'test_collection', keys: ['1'] });

		expect(client.send).toBeCalledTimes(1);
		expect(client.send).toBeCalledWith(expect.stringContaining('COLLECTION_INACTIVE'));
	});
});
