import type { EventContext } from '@directus/types';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../emitter.js';
import { ItemsService, MetaService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { WebSocketClient } from '../types.js';
import { ItemsHandler } from './items.js';

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
	ItemsService: vi.fn(),
	MetaService: vi.fn(),
}));

function mockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability: null,
	} as unknown as WebSocketClient;
}

describe('WebSocket heartbeat handler', () => {
	let handler: ItemsHandler;

	beforeEach(() => {
		vi.useFakeTimers();
		// initialize handler
		handler = new ItemsHandler();
	});

	afterEach(() => {
		vi.useRealTimers();
		emitter.offAll();
		vi.clearAllMocks();
	});

	test('ignore other message types', async () => {
		const spy = vi.spyOn(handler, 'onMessage');

		// receive message
		emitter.emitAction(
			'websocket.message',
			{
				client: mockClient(),
				message: { type: 'pong' },
			},
			{} as EventContext,
		);

		// expect nothing
		expect(spy).not.toBeCalled();
	});

	test('invalid collection should error', async () => {
		(getSchema as Mock).mockImplementation(() => ({ collections: {} }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'create', data: {} },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled

		// expect error
		expect(fakeClient.send).toBeCalledWith(
			'{"type":"items","status":"error","error":{"code":"INVALID_COLLECTION","message":"The provided collection does not exists or is not accessible."}}',
		);
	});

	test('create one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));

		const createOne = vi.fn(),
			readOne = vi.fn();

		(ItemsService as Mock).mockImplementation(() => ({ createOne, readOne }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'create', data: {} },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(createOne).toBeCalled();
		expect(readOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('create multiple items', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));

		const createMany = vi.fn(),
			readMany = vi.fn();

		(ItemsService as Mock).mockImplementation(() => ({ createMany, readMany }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'create', data: [{}, {}] },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(createMany).toBeCalled();
		expect(readMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('read by query', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const readByQuery = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ readByQuery }));
		const getMetaForQuery = vi.fn();
		(MetaService as Mock).mockImplementation(() => ({ getMetaForQuery }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'read', query: {} },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(readByQuery).toBeCalled();
		expect(getMetaForQuery).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('update one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));

		const updateOne = vi.fn(),
			readOne = vi.fn();

		(ItemsService as Mock).mockImplementation(() => ({ updateOne, readOne }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'update', data: {}, id: '123' },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(updateOne).toBeCalled();
		expect(readOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('update multiple items', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));

		const updateMany = vi.fn(),
			readMany = vi.fn();

		(ItemsService as Mock).mockImplementation(() => ({ updateMany, readMany }));
		const getMetaForQuery = vi.fn();
		(MetaService as Mock).mockImplementation(() => ({ getMetaForQuery }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'update', data: {}, ids: ['123', '456'] },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(updateMany).toBeCalled();
		expect(getMetaForQuery).toBeCalled();
		expect(readMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('delete one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteOne = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteOne }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'delete', id: '123' },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(deleteOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('delete multiple items by id', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteMany = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteMany }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'delete', ids: ['123', 456] },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(deleteMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});

	test('delete multiple items by query', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteByQuery = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteByQuery }));
		// receive message
		const fakeClient = mockClient();

		emitter.emitAction(
			'websocket.message',
			{
				client: fakeClient,
				message: { type: 'items', collection: 'test', action: 'delete', query: {} },
			},
			{} as EventContext,
		);

		await vi.runAllTimersAsync(); // flush promises to make sure the event is handled
		// expect service functions
		expect(deleteByQuery).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
});
