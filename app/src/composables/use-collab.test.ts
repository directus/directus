import { ErrorCode } from '@directus/errors';
import { ACTION } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import { useCollab } from './use-collab';

const {
	mockWebSocketHandlers,
	mockSDK,
	mockServerStore,
	mockSettingsStore,
	mockNotificationsStore,
	mockPermissionsStore,
	mockRelationsStore,
	mockFieldsStore,
	mockRouter,
} = vi.hoisted(() => {
	const mockWebSocketHandlers: Record<string, any[]> = {};

	const mockSDK = {
		connect: vi.fn(),
		disconnect: vi.fn(),
		sendMessage: vi.fn(),
		onWebSocket: vi.fn((event, handler) => {
			if (!mockWebSocketHandlers[event]) mockWebSocketHandlers[event] = [];
			mockWebSocketHandlers[event].push(handler);

			return () => {
				mockWebSocketHandlers[event] = mockWebSocketHandlers[event]?.filter((h) => h !== handler) ?? [];
			};
		}),
		isConnected: vi.fn().mockResolvedValue(false),
		request: vi.fn().mockResolvedValue([]),
	};

	const mockServerStore = {
		info: { websocket: { collaborativeEditing: true } },
		hydrate: vi.fn(),
	};

	const mockSettingsStore = {
		settings: { collaborative_editing_enabled: true },
		hydrate: vi.fn(),
	};

	const mockNotificationsStore = { add: vi.fn(), queue: [] };
	const mockPermissionsStore = { getPermission: vi.fn().mockReturnValue({ access: 'all' }) };
	const mockRelationsStore = { getRelationForField: vi.fn() };
	const mockFieldsStore = { getPrimaryKeyFieldForCollection: vi.fn() };
	const mockRouter = { push: vi.fn() };

	return {
		mockWebSocketHandlers,
		mockSDK,
		mockServerStore,
		mockSettingsStore,
		mockNotificationsStore,
		mockPermissionsStore,
		mockRelationsStore,
		mockFieldsStore,
		mockRouter,
	};
});

vi.mock('@/sdk', () => ({
	process: {
		env: {},
	},
	sdk: {
		with: vi.fn().mockReturnValue(mockSDK),
	},
}));

vi.mock('@/stores/server', () => ({
	useServerStore: vi.fn(() => mockServerStore),
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(() => mockSettingsStore),
}));

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: vi.fn(() => mockNotificationsStore),
}));

vi.mock('@/stores/permissions', () => ({
	usePermissionsStore: vi.fn(() => mockPermissionsStore),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: vi.fn(() => mockRelationsStore),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: vi.fn(() => mockFieldsStore),
}));

vi.mock('vue-i18n', () => ({
	useI18n: vi.fn(() => ({
		t: vi.fn((key) => key),
	})),
}));

vi.mock('vue-router', () => ({
	useRouter: vi.fn(() => mockRouter),
}));

vi.mock('vue', async () => {
	const actual = (await vi.importActual('vue')) as any;
	return {
		...actual,
		onMounted: vi.fn((fn) => fn()),
		onBeforeUnmount: vi.fn((fn) => {
			(globalThis as any)._onBeforeUnmount = fn;
		}),
	};
});

async function emitWebSocketMessage(message: any) {
	const handlers = mockWebSocketHandlers['message'] ? [...mockWebSocketHandlers['message']] : [];
	for (const handler of handlers) await handler(message);
}

async function emitWebSocketOpen() {
	const handlers = mockWebSocketHandlers['open'] ? [...mockWebSocketHandlers['open']] : [];
	for (const handler of handlers) await handler();
}

describe('useCollab', () => {
	let collection: Ref<string>;
	let item: Ref<any>;
	let version: Ref<any>;
	let initialValues: Ref<any>;
	let edits: Ref<any>;
	let getItem: any;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();

		for (const key in mockWebSocketHandlers) delete mockWebSocketHandlers[key];

		mockServerStore.info.websocket.collaborativeEditing = true;
		mockSettingsStore.settings.collaborative_editing_enabled = true;
		mockSDK.isConnected.mockResolvedValue(false);
		mockSDK.request.mockResolvedValue([]);

		collection = ref('test_collection');
		item = ref<any>('123');
		version = ref<any>(null);
		initialValues = ref<any>({});
		edits = ref<any>({});
		getItem = vi.fn();
	});

	afterEach(() => {
		if ((globalThis as any)._onBeforeUnmount) {
			(globalThis as any)._onBeforeUnmount();
			(globalThis as any)._onBeforeUnmount = null;
		}

		vi.useRealTimers();
	});

	test('connects to websocket on mount if enabled', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);

		await vi.waitFor(() => {
			expect(mockSDK.connect).toHaveBeenCalled();
		});
	});

	test('joins a room when connected', async () => {
		const { connected } = useCollab(collection, item, version, initialValues, edits, getItem);

		emitWebSocketOpen();
		await nextTick();
		expect(connected.value).toBe(true);

		vi.advanceTimersByTime(10);

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.JOIN,
				collection: 'test_collection',
				item: '123',
			}),
		);
	});

	test('receives updates and respects chronological order', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		// Valid update
		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.UPDATE,
			room: 'test-room',
			field: 'title',
			changes: 'Updated',
			order: 1,
		});

		expect(edits.value.title).toBe('Updated');

		// Out-of-order/stale update should be ignored
		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.UPDATE,
			room: 'test-room',
			field: 'title',
			changes: 'Stale',
			order: 1,
		});

		expect(edits.value.title).toBe('Updated');

		// Future update
		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.UPDATE,
			room: 'test-room',
			field: 'title',
			changes: 'Latest',
			order: 5,
		});

		expect(edits.value.title).toBe('Latest');
	});

	test('reconciles M2O fields', async () => {
		mockRelationsStore.getRelationForField.mockReturnValue({
			related_collection: 'related_coll',
		} as any);

		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({
			field: 'id',
		} as any);

		initialValues.value = { author: 1 };
		edits.value = { author: { id: 1, name: 'John' } };

		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.UPDATE,
			room: 'test-room',
			field: 'author',
			changes: { id: 1, name: 'John' },
			order: 1,
		});

		expect(initialValues.value.author).toEqual({ id: 1, name: 'John' });
		expect(edits.value.author).toBeUndefined();
	});

	test('handles service unavailable error and disconnects', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.ERROR,
			code: ErrorCode.ServiceUnavailable,
		});

		expect(mockServerStore.hydrate).toHaveBeenCalled();
		expect(mockSettingsStore.hydrate).toHaveBeenCalled();
		expect(mockSDK.disconnect).toHaveBeenCalled();
	});

	test('reacts to active prop changes', async () => {
		const active = ref(true);
		item.value = 'active-prop-test';
		useCollab(collection, item, version, initialValues, edits, getItem, active);

		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'room-active-test',
			collection: 'test_collection',
			item: 'active-prop-test',
			changes: {},
			users: [],
			focuses: {},
		});

		active.value = false;
		await nextTick();

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.LEAVE }));
	});

	test('throttles field updates', async () => {
		const { collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		const field = collabContext.registerField('title');

		field.onFieldUpdate('v1');
		field.onFieldUpdate('v2');
		field.onFieldUpdate('v3');

		expect(mockSDK.sendMessage).toHaveBeenCalledTimes(2); // JOIN + leading
		vi.advanceTimersByTime(100);
		expect(mockSDK.sendMessage).toHaveBeenCalledTimes(3); // Trailing

		expect(mockSDK.sendMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.UPDATE,
				changes: 'v3',
				field: 'title',
			}),
		);
	});

	test('debounces focus changes', async () => {
		const { collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		const field = collabContext.registerField('title');

		field.onFocus();
		expect(mockSDK.sendMessage).toHaveBeenCalledTimes(1); // Debouncing
		vi.advanceTimersByTime(100);
		expect(mockSDK.sendMessage).toHaveBeenCalledTimes(2); // Sent

		expect(mockSDK.sendMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.FOCUS,
				field: 'title',
			}),
		);
	});

	test('leaves room on unmount', async () => {
		item.value = 'unmount-test';
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'room-unmount-test',
			collection: 'test_collection',
			item: 'unmount-test',
			changes: {},
			users: [],
			focuses: {},
		});

		if ((globalThis as any)._onBeforeUnmount) {
			(globalThis as any)._onBeforeUnmount();
			(globalThis as any)._onBeforeUnmount = null;
		}

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.LEAVE,
			}),
		);
	});

	test('handles discard message', async () => {
		edits.value = { title: 'New', notes: 'Desc' };

		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'room-discard-test',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.DISCARD,
			room: 'room-discard-test',
			fields: ['title'],
		});

		expect(edits.value.title).toBeUndefined();
		expect(edits.value.notes).toBe('Desc');

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.DISCARD,
			room: 'room-discard-test',
			fields: ['*'],
		});

		expect(edits.value).toEqual({});
	});

	test('clears colliding changes', async () => {
		const { collabCollision, clearCollidingChanges } = useCollab(
			collection,
			item,
			version,
			initialValues,
			edits,
			getItem,
		);

		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		edits.value = { title: 'Local' };

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'room-collision-test',
			collection: 'test_collection',
			item: '123',
			changes: { title: 'Server' },
			users: [],
			focuses: {},
		});

		expect(collabCollision.value).toBeDefined();
		expect(collabCollision.value?.to.title).toBe('Local');

		clearCollidingChanges();
		expect(collabCollision.value).toBeUndefined();
	});

	test('handles join message and adds user', async () => {
		const { users } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		mockSDK.request.mockResolvedValueOnce({ id: 'user-2', first_name: 'Jane', last_name: 'Smith' });

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.JOIN,
			room: 'test-room',
			user: 'user-2',
			color: 'blue',
			connection: 'conn-2',
		});

		expect(users.value).toHaveLength(1);

		expect(users.value[0]).toMatchObject({
			id: 'user-2',
			first_name: 'Jane',
			last_name: 'Smith',
			color: 'blue',
			connection: 'conn-2',
		});
	});

	test('handles leave message and removes user', async () => {
		const { users, collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		mockSDK.request.mockResolvedValueOnce([{ id: 'user-1', first_name: 'John' }]);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-self',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [{ user: 'user-1', color: 'red', connection: 'conn-1' }],
			focuses: {},
		});

		expect(users.value).toHaveLength(1);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.FOCUS,
			room: 'test-room',
			connection: 'conn-1',
			field: 'title',
		});

		expect(collabContext.focusedFields).toContain('title');

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.LEAVE,
			room: 'test-room',
			connection: 'conn-1',
		});

		expect(users.value).toHaveLength(0);
		expect(collabContext.focusedFields).not.toContain('title');
	});

	test('handles focus message from other users', async () => {
		const { collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		mockSDK.request.mockResolvedValueOnce([{ id: 'user-1', first_name: 'John' }]);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-self',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [{ user: 'user-1', color: 'red', connection: 'conn-1' }],
			focuses: {},
		});

		const field = collabContext.registerField('title');

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.FOCUS,
			room: 'test-room',
			connection: 'conn-1',
			field: 'title',
		});

		expect(field.focusedBy.value).toBeDefined();
		expect(field.focusedBy.value?.connection).toBe('conn-1');
	});

	test('handles field unset', async () => {
		const { collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		const field = collabContext.registerField('title');
		field.onFieldUnset();

		expect(mockSDK.sendMessage).toHaveBeenCalledTimes(2);
		vi.advanceTimersByTime(100);

		expect(mockSDK.sendMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.UPDATE,
				field: 'title',
			}),
		);
	});

	test('handles save message and reconciles edits including relations', async () => {
		mockRelationsStore.getRelationForField.mockReturnValue({ related_collection: 'authors' });
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });

		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		initialValues.value = { title: 'Saved Title', author: 1 };
		edits.value = { title: 'Saved Title', author: { id: 1, name: 'John' } };

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.SAVE,
			room: 'test-room',
		});

		expect(getItem).toHaveBeenCalled();
		expect(edits.value.title).toBeUndefined();
		expect(edits.value.author).toBeUndefined();

		expect(mockNotificationsStore.add).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'item_update_success',
			}),
		);
	});

	test('does not join when item is new (+)', async () => {
		item.value = '+';
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		expect(mockSDK.sendMessage).not.toHaveBeenCalled();
	});

	test('resets state on websocket close', async () => {
		const { connected, users } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		expect(connected.value).toBe(true);

		vi.advanceTimersByTime(10);

		mockSDK.request.mockResolvedValueOnce([{ id: 'user-1', first_name: 'John' }]);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [{ user: 'user-1', color: 'red', connection: 'conn-1' }],
			focuses: {},
		});

		expect(users.value).toHaveLength(1);

		const closeHandlers = mockWebSocketHandlers['close'] ? [...mockWebSocketHandlers['close']] : [];
		for (const handler of closeHandlers) await handler();

		expect(connected.value).toBe(false);
		expect(users.value).toHaveLength(0);
	});

	test('handles delete message and redirects', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.DELETE,
			room: 'test-room',
		});

		expect(mockNotificationsStore.add).toHaveBeenCalledWith(expect.objectContaining({ title: 'item_deleted' }));
		expect(mockRouter.push).toHaveBeenCalledWith('/content/test_collection');
	});

	test('handles INIT and populates users', async () => {
		const { users } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		mockSDK.request.mockResolvedValueOnce([
			{ id: 'user-1', first_name: 'Me', last_name: 'Mine' },
			{ id: 'user-2', first_name: 'Other', last_name: 'Person' },
		]);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-self',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [
				{ user: 'user-2', color: 'blue', connection: 'conn-other' },
				{ user: 'user-1', color: 'red', connection: 'conn-self' },
			],
			focuses: {},
		});

		expect(users.value).toHaveLength(2);

		expect(users.value[0]).toMatchObject({
			id: 'user-1',
			first_name: 'Me',
			color: 'red',
			connection: 'conn-self',
		});

		expect(users.value[1]).toMatchObject({
			id: 'user-2',
			first_name: 'Other',
			color: 'blue',
			connection: 'conn-other',
		});
	});

	test('rejoins if self is kicked', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-self',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		// Clear mock to see if join() is called again
		mockSDK.sendMessage.mockClear();

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.LEAVE,
			room: 'test-room',
			connection: 'conn-self',
		});

		vi.advanceTimersByTime(2000); // Wait for rejoin timeout

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.JOIN }));
	});

	test('update context function sends update all', async () => {
		const { update } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		update({ title: 'Bulk' });

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				action: ACTION.CLIENT.UPDATE_ALL,
				changes: { title: 'Bulk' },
			}),
		);

		expect(edits.value.title).toBe('Bulk');
	});

	test('does not send focus if already focused by someone else', async () => {
		const { collabContext } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: { 'conn-other': 'title' },
		});

		const field = collabContext.registerField('title');

		mockSDK.sendMessage.mockClear();
		field.onFocus();
		vi.advanceTimersByTime(110);

		expect(mockSDK.sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.FOCUS }));
	});

	test('reacts to collection or item changes', async () => {
		useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'room-1',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		mockSDK.sendMessage.mockClear();

		// Change item
		item.value = '456';
		await nextTick();

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.LEAVE }));

		vi.advanceTimersByTime(10); // Join debounced

		expect(mockSDK.sendMessage).toHaveBeenCalledWith(
			expect.objectContaining({ action: ACTION.CLIENT.JOIN, item: '456' }),
		);
	});

	test('local discard function clears edits and sends message', async () => {
		const { discard } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		edits.value = { title: 'Dirty' };
		discard();

		expect(edits.value).toEqual({});
		expect(mockSDK.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.DISCARD }));
	});

	test('local discard function does nothing without permission', async () => {
		const { discard } = useCollab(collection, item, version, initialValues, edits, getItem);
		emitWebSocketOpen();
		await nextTick();
		vi.advanceTimersByTime(10);

		await emitWebSocketMessage({
			type: 'collab',
			action: ACTION.SERVER.INIT,
			room: 'test-room',
			connection: 'conn-1',
			collection: 'test_collection',
			item: '123',
			changes: {},
			users: [],
			focuses: {},
		});

		mockPermissionsStore.getPermission.mockReturnValue({ access: 'none' });
		edits.value = { title: 'Dirty' };

		discard();

		expect(edits.value.title).toBe('Dirty');
		expect(mockSDK.sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ action: ACTION.CLIENT.DISCARD }));
	});
});
