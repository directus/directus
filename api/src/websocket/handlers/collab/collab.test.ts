import { InvalidPayloadError } from '@directus/errors';
import { type WebSocketClient } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../../emitter.js';
import { fetchAllowedCollections } from '../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { scheduleSynchronizedJob } from '../../../utils/schedule.js';
import { handleWebSocketError } from '../../errors.js';
import { CollabHandler } from './collab.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		info: vi.fn(),
	}),
}));

vi.mock('../../../database/index.js');
vi.mock('../../../emitter.js');
vi.mock('../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('../../../utils/get-service.js');
vi.mock('../../../utils/schedule.js');
vi.mock('../../errors.js');
vi.mock('./messenger.js');
vi.mock('./room.js');
vi.mock('./verify-permissions.js');

describe('CollabHandler', () => {
	let handler: CollabHandler;
	let mockClient: WebSocketClient;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		handler = new CollabHandler();

		mockClient = {
			uid: 'test-client',
			accountability: { user: 'test-user', role: 'test-role' },
			on: vi.fn(),
		} as any;

		vi.mocked(verifyPermissions).mockResolvedValue(['*']);
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe('onJoin', () => {
		test('rejects joins from shares', async () => {
			mockClient.accountability!.share = 'test-share';

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'join');

			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toBe('Collaboration is not supported for shares');
		});

		test('rejects access if collection is not in allowedCollections', async () => {
			vi.mocked(getSchema).mockResolvedValue({ collections: { articles: {} } } as any);
			vi.mocked(fetchAllowedCollections).mockResolvedValue(['other_collection']);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'join');

			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to access collection/);
		});

		test('rejects if item ID is missing for non-singleton collection', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			vi.mocked(fetchAllowedCollections).mockResolvedValue(['articles']);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'join');

			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toBe('Item id has to be provided for non singleton collections');
		});

		test('rejects if item does not exist or user has no access', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			vi.mocked(fetchAllowedCollections).mockResolvedValue(['articles']);

			const mockService = { readOne: vi.fn().mockRejectedValue(new Error('Forbidden')) };
			vi.mocked(getService).mockReturnValue(mockService as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'join');

			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toBe('No permission to access item or it does not exist');
		});

		test('creates room and joins client on success (standard collection)', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			vi.mocked(fetchAllowedCollections).mockResolvedValue(['articles']);

			const mockService = { readOne: vi.fn().mockResolvedValue({ id: 1 }) };
			vi.mocked(getService).mockReturnValue(mockService as any);

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(handler.roomManager.createRoom).toHaveBeenCalledWith('articles', 1, null, undefined);
			expect(mockRoom.join).toHaveBeenCalledWith(mockClient);
			expect(handleWebSocketError).not.toHaveBeenCalled();
		});

		test('creates room and joins client on success (singleton collection)', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					settings: { singleton: true },
				},
			} as any);

			vi.mocked(fetchAllowedCollections).mockResolvedValue(['settings']);

			const mockService = { readSingleton: vi.fn().mockResolvedValue({ id: 1 }) };
			vi.mocked(getService).mockReturnValue(mockService as any);

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'settings' } as any);

			expect(mockService.readSingleton).toHaveBeenCalled();
			expect(handler.roomManager.createRoom).toHaveBeenCalledWith('settings', undefined, null, undefined);
			expect(mockRoom.join).toHaveBeenCalledWith(mockClient);
		});

		test('propagates version to createRoom', async () => {
			vi.mocked(getSchema).mockResolvedValue({ collections: { articles: {} } } as any);
			vi.mocked(fetchAllowedCollections).mockResolvedValue(['articles']);
			vi.mocked(getService).mockReturnValue({ readOne: vi.fn().mockResolvedValue({ id: 1 }) } as any);

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1, version: 'v1' } as any);

			expect(handler.roomManager.createRoom).toHaveBeenCalledWith('articles', 1, 'v1', undefined);
		});
	});

	describe('onFocus', () => {
		test('rejects if room does not exist', async () => {
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(undefined);

			await handler.onFocus(mockClient, { action: 'focus', room: 'invalid-room', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/room does not exist/);
		});

		test('rejects if client is not in room', async () => {
			const mockRoom = { hasClient: vi.fn().mockResolvedValue(false) };
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/Not connected to room/);
		});

		test('rejects if field read or update permission is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(verifyPermissions).mockResolvedValue(['id']); // only 'id' allowed

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to focus on field/);
		});

		test('rejects if field is already focused by another', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				focus: vi.fn().mockResolvedValue(false),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/already focused by another user/);
		});

		test('calls room.focus on success', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				focus: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(mockRoom.focus).toHaveBeenCalledWith(mockClient, 'title');
			expect(handleWebSocketError).not.toHaveBeenCalled();
		});
	});

	describe('onUpdate', () => {
		test('rejects if client is not focused on the field', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('other-field'),
				focus: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'test',
			} as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/without focusing on it first/);
		});

		test('rejects if field update permission is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(verifyPermissions).mockResolvedValue(['id']);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'test',
			} as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to update field title/);
		});

		test('rejects if field does not exist in schema even if permission allows', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('random_field'),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(verifyPermissions).mockResolvedValue(['random_field']);

			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { fields: { title: {} } },
				},
			} as any);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'random_field',
				changes: 'test',
			} as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/field does not exist/);
		});

		test('handles error in update gracefully', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				update: vi.fn().mockRejectedValue(new Error('Update failed')),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'new value',
			} as any);

			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { title: 'new value' });
			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(Error), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.message).toBe('Update failed');
		});

		test('calls room.update on success', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				update: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'new value',
			} as any);

			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { title: 'new value' });
			expect(handleWebSocketError).not.toHaveBeenCalled();
		});
	});

	describe('onUpdateAll', () => {
		test('rejects if any field update permission is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getCollection: vi.fn().mockResolvedValue('articles'),
				getFocusByField: vi.fn().mockResolvedValue(null),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdateAll(mockClient, {
				action: 'update_all',
				room: 'room-uid',
				changes: { title: 'New', secret: 'Hack' },
			} as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to update field secret/);
		});

		test('skips fields focused by others and updates remaining', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getCollection: vi.fn().mockResolvedValue('articles'),
				getFocusByField: vi.fn().mockImplementation((field) => (field === 'title' ? 'other-client' : null)),
				update: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdateAll(mockClient, {
				action: 'update_all',
				room: 'room-uid',
				changes: { title: 'Ignored', content: 'Updated' },
			} as any);

			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { content: 'Updated' });
			expect(handleWebSocketError).not.toHaveBeenCalled();
		});
	});

	describe('onLeave', () => {
		test('leaves specific room if room ID provided', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockReturnValue(true),
				leave: vi.fn(),
				uid: 'room-uid',
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onLeave(mockClient, { action: 'leave', room: 'room-uid', type: 'collab' });

			expect(mockRoom.leave).toHaveBeenCalledWith(mockClient.uid);
		});

		test('leaves all rooms if no room ID provided', async () => {
			const mockRoom1 = { leave: vi.fn(), uid: 'room-1' };
			const mockRoom2 = { leave: vi.fn(), uid: 'room-2' };

			vi.mocked(handler.roomManager.getClientRooms).mockResolvedValue([mockRoom1, mockRoom2] as any);

			await handler.onLeave(mockClient);

			expect(mockRoom1.leave).toHaveBeenCalledWith(mockClient.uid);
			expect(mockRoom2.leave).toHaveBeenCalledWith(mockClient.uid);
		});

		test('throws error if room does not exist', async () => {
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(undefined);

			await handler.onLeave(mockClient, { action: 'leave', room: 'invalid-room', type: 'collab' });

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'leave');
		});
	});

	describe('onUpdate (unset)', () => {
		test('calls room.unset when changes property is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				unset: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				type: 'collab',
				// no changes
			} as any);

			expect(mockRoom.unset).toHaveBeenCalledWith(mockClient, 'title');
		});
	});

	describe('bindWebSocket', () => {
		test('handles websocket.error event', async () => {
			const onLeaveSpy = vi.spyOn(handler, 'onLeave');

			// Find the listener for websocket.error
			const errorCallback = vi
				.mocked(emitter.onAction)
				.mock.calls.find((call: any[]) => call[0] === 'websocket.error')![1] as any;

			await errorCallback({ client: mockClient });

			expect(onLeaveSpy).toHaveBeenCalledWith(mockClient);
		});

		test('handles websocket.close event', async () => {
			const onLeaveSpy = vi.spyOn(handler, 'onLeave');

			const closeCallback = vi
				.mocked(emitter.onAction)
				.mock.calls.find((call: any[]) => call[0] === 'websocket.close')![1] as any;

			await closeCallback({ client: mockClient });

			expect(onLeaveSpy).toHaveBeenCalledWith(mockClient);
		});
	});

	describe('Cleanup Job', () => {
		test('performs heritage sweep for dead nodes', async () => {
			const cleanupJob = vi
				.mocked(scheduleSynchronizedJob)
				.mock.calls.findLast((call) => call[0] === 'collab')![2] as any;

			const mockDeadRoomUid = 'dead-room-uid';
			const mockDeadClientUid = 'dead-client-uid';

			vi.spyOn(handler.messenger, 'pruneDeadInstances').mockResolvedValue({
				inactive: { clients: [mockDeadClientUid], rooms: [mockDeadRoomUid] },
				active: [],
			});

			const mockRoom = {
				uid: mockDeadRoomUid,
				hasClient: vi.fn().mockResolvedValue(true),
				leave: vi.fn(),
				close: vi.fn().mockResolvedValue(true),
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(handler.roomManager.getAllClients).mockResolvedValue([]);
			vi.mocked(handler.roomManager.getClientRooms).mockResolvedValue([]);

			await cleanupJob();

			expect(handler.roomManager.getRoom).toHaveBeenCalledWith(mockDeadRoomUid);
			expect(mockRoom.leave).toHaveBeenCalledWith(mockDeadClientUid);
			expect(mockRoom.close).toHaveBeenCalled();
		});
	});
});
