import { setTimeout as delay } from 'node:timers/promises';
import { ForbiddenError, ServiceUnavailableError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { ItemsService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { WebSocketEvent, WebSocketSubscribeMessage } from '../messages.js';
import type { WebSocketClient } from '../types.js';
import { validateDeleteEventAccess, validateSubscriptionAccess } from '../utils/validate-subscription-access.js';
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

vi.mock('../utils/validate-subscription-access.js', () => ({
	validateSubscriptionAccess: vi.fn(),
	validateDeleteEventAccess: vi.fn(),
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

function mockSchema(...collections: string[]) {
	const schema = new SchemaBuilder();

	for (const collection of collections) {
		schema.collection(collection, (c) => {
			c.field('id').id();
		});
	}

	vi.mocked(getSchema).mockResolvedValue(schema.build());
}

describe('WebSocket subscribe handler', () => {
	let handler: SubscribeHandler;

	beforeEach(() => {
		// initialize handler
		handler = new SubscribeHandler();
	});

	afterEach(() => {
		emitter.offAll();
		vi.resetAllMocks();
	});

	function requestSubscription(client: WebSocketClient, message: Record<string, unknown> = {}) {
		return handler.onMessage(client, {
			type: 'subscribe',
			collection: 'test_collection',
			uid: '123',
			...message,
		} as unknown as WebSocketSubscribeMessage);
	}

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
		const client = mockClient(createDefaultAccountability({ admin: true }));

		vi.mocked(getSchema).mockResolvedValue(
			new SchemaBuilder()
				.collection('test_collection', (c) => {
					c.field('id').id();
				})
				.options({ status: 'inactive' })
				.build(),
		);

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
		const client = mockClient(createDefaultAccountability({ admin: true }));

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
		test('should use the initial payload read as the access check for subscriptions without an event filter', async () => {
			const client = mockClient(createDefaultAccountability());

			mockSchema('test_collection');

			vi.mocked(ItemsService.prototype.readByQuery).mockRejectedValueOnce(new ForbiddenError());

			await requestSubscription(client);

			expect(validateSubscriptionAccess).not.toBeCalled();
			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
			expect(client.send).toBeCalledWith(expect.stringContaining('FORBIDDEN'));
		});

		test('should validate access for subscriptions filtered on events', async () => {
			const accountability = createDefaultAccountability();
			const client = mockClient(accountability);

			mockSchema('test_collection');

			await requestSubscription(client, { event: 'create', item: 5 });

			expect(validateSubscriptionAccess).toBeCalledWith(
				{ accountability, collection: 'test_collection', event: 'create', item: '5' },
				expect.anything(),
			);

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});

		test('should reject subscriptions filtered on events without access', async () => {
			const client = mockClient(createDefaultAccountability());

			mockSchema('test_collection');

			vi.mocked(validateSubscriptionAccess).mockRejectedValueOnce(new ForbiddenError());

			await requestSubscription(client, { event: 'delete' });

			expect(handler.subscriptions['test_collection']?.size).toBeFalsy();
			expect(client.send).toBeCalledWith(expect.stringContaining('FORBIDDEN'));
			expect(client.send).toBeCalledWith(expect.stringContaining('"uid":"123"'));
		});

		test('should keep an existing subscription when a rejected one reuses its uid', async () => {
			const client = mockClient(createDefaultAccountability());

			mockSchema('test_collection');

			await requestSubscription(client, { event: 'delete' });

			expect(handler.subscriptions['test_collection']?.size).toBe(1);

			vi.mocked(validateSubscriptionAccess).mockRejectedValueOnce(new ForbiddenError());

			await requestSubscription(client, { event: 'delete' });

			expect(handler.subscriptions['test_collection']?.size).toBe(1);
		});
	});

	describe('access control on dispatch', () => {
		const events = {
			update: { action: 'update', collection: 'test_collection', keys: ['5'] },
			delete: { action: 'delete', collection: 'test_collection', keys: ['5'] },
		} satisfies Record<string, WebSocketEvent>;

		const deleteMessage = JSON.stringify({ type: 'subscription', event: 'delete', data: ['5'], uid: '123' });

		async function subscribeTo(client: WebSocketClient, event: keyof typeof events) {
			mockSchema('test_collection');

			await requestSubscription(client, { event });

			expect(client.send).toBeCalledWith(expect.stringContaining('"event":"init"'));
			vi.mocked(client.send).mockClear();
		}

		test('should validate delete events before dispatching them', async () => {
			const accountability = createDefaultAccountability();
			const client = mockClient(accountability);
			await subscribeTo(client, 'delete');

			await handler.dispatch(events.delete);

			expect(validateDeleteEventAccess).toBeCalledWith(
				{ accountability, collection: 'test_collection', itemScoped: false },
				expect.anything(),
			);

			expect(client.send).toBeCalledWith(deleteMessage);
		});

		test('should validate delete events of item scoped subscriptions as item scoped', async () => {
			const client = mockClient(createDefaultAccountability());

			mockSchema('test_collection');
			handler.subscribe({ client, collection: 'test_collection', event: 'delete', item: '5', uid: '123' });

			await handler.dispatch(events.delete);

			expect(validateDeleteEventAccess).toBeCalledWith(
				expect.objectContaining({ itemScoped: true }),
				expect.anything(),
			);

			expect(client.send).toBeCalledWith(
				JSON.stringify({ type: 'subscription', event: 'delete', data: '5', uid: '123' }),
			);
		});

		test('should not dispatch events of other items to item scoped subscriptions', async () => {
			const client = mockClient(createDefaultAccountability());

			mockSchema('test_collection');
			handler.subscribe({ client, collection: 'test_collection', event: 'delete', item: '6', uid: '123' });

			await handler.dispatch(events.delete);

			expect(client.send).not.toBeCalled();
		});

		test('should dispatch update events read with the permissions of the subscriber', async () => {
			const accountability = createDefaultAccountability();
			const client = mockClient(accountability);
			await subscribeTo(client, 'update');

			vi.mocked(ItemsService.prototype.readMany).mockResolvedValueOnce([{ id: '5' }]);

			await handler.dispatch(events.update);

			expect(validateDeleteEventAccess).not.toBeCalled();
			expect(ItemsService).toHaveBeenLastCalledWith('test_collection', expect.objectContaining({ accountability }));
			expect(ItemsService.prototype.readMany).toBeCalledWith(['5'], {});

			expect(client.send).toBeCalledWith(
				JSON.stringify({ type: 'subscription', event: 'update', data: [{ id: '5' }], uid: '123' }),
			);
		});

		test('should not dispatch events the subscriber can no longer read', async () => {
			const client = mockClient(createDefaultAccountability());
			await subscribeTo(client, 'update');

			vi.mocked(ItemsService.prototype.readMany).mockRejectedValueOnce(new ForbiddenError());

			await handler.dispatch(events.update);

			expect(client.send).not.toBeCalled();
		});

		test('should keep dispatching to other subscribers when one is denied access', async () => {
			const denied = mockClient(createDefaultAccountability());
			const allowed = mockClient(createDefaultAccountability());
			await subscribeTo(denied, 'delete');
			await subscribeTo(allowed, 'delete');

			vi.mocked(validateDeleteEventAccess).mockRejectedValueOnce(new ForbiddenError());

			await handler.dispatch(events.delete);

			expect(denied.send).not.toBeCalled();
			expect(allowed.send).toBeCalledWith(deleteMessage);
		});

		test('should report errors other than permission errors to the subscriber', async () => {
			const client = mockClient(createDefaultAccountability());
			await subscribeTo(client, 'delete');

			vi.mocked(validateDeleteEventAccess).mockRejectedValueOnce(
				new ServiceUnavailableError({ service: 'database', reason: 'down' }),
			);

			await handler.dispatch(events.delete);

			expect(client.send).toBeCalledWith(expect.stringContaining('SERVICE_UNAVAILABLE'));
		});
	});
});
