import { type WebSocketClient } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import emitter from '../../../emitter.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
import { scheduleSynchronizedJob } from '../../../utils/schedule.js';
import { CollabHandler } from './collab.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	}),
}));

vi.mock('../../../database/index.js');
vi.mock('../../../emitter.js');
vi.mock('../../../permissions/modules/validate-access/lib/validate-item-access.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('../../../utils/schedule.js');
vi.mock('../../errors.js');

vi.mock('./messenger.js', () => ({
	Messenger: vi.fn().mockImplementation(() => ({
		handleError: vi.fn(),
		pruneDeadInstances: vi.fn(),
		messenger: {
			subscribe: vi.fn(),
		},
	})),
}));

vi.mock('./room.js', () => ({
	getRoomHash: vi.fn((coll, item, version) => `${coll}_${item}_${version}`),
	RoomManager: vi.fn().mockImplementation(() => ({
		rooms: {},
		terminateAll: vi.fn(),
		createRoom: vi.fn().mockResolvedValue({ join: vi.fn() }),
		getRoom: vi.fn(),
		getClientRooms: vi.fn().mockResolvedValue([]),
		getAllRoomClients: vi.fn().mockResolvedValue([]),
		removeRoom: vi.fn(),
	})),
}));

vi.mock('./verify-permissions.js');

vi.mock('../../../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: vi.fn().mockResolvedValue({ collaboration: true }),
	})),
}));

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
		vi.mocked(handler.roomManager.getClientRooms).mockResolvedValue([]);

		vi.mocked(getSchema).mockResolvedValue({
			collections: {
				articles: {
					primary: 'id',
					collection: 'articles',
					fields: { title: { field: 'title' }, content: { field: 'content' } },
				},
			},
			relations: [],
		} as any);
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe('onJoin', () => {
		test('rejects joins from shares', async () => {
			mockClient.accountability!.share = 'test-share';

			await expect(
				handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any),
			).rejects.toHaveProperty('extensions.reason', 'Collaboration is not supported for shares');
		});

		test('rejects access if validateItemAccess returns false', async () => {
			vi.mocked(getSchema).mockResolvedValue({ collections: { articles: {} }, relations: [] } as any);
			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: false });

			await expect(
				handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any),
			).rejects.toHaveProperty('extensions.reason', 'No permission to access item or it does not exist');
		});

		test('rejects if item ID is missing for non-singleton collection', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			await expect(
				handler.onJoin(mockClient, { action: 'join', collection: 'articles' } as any),
			).rejects.toHaveProperty('extensions.reason', 'Item id has to be provided for non singleton collections');
		});

		test('rejects if item does not exist or user has no access', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: false });

			await expect(
				handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any),
			).rejects.toHaveProperty('extensions.reason', 'No permission to access item or it does not exist');
		});

		test('creates room and joins client on success (standard collection)', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { singleton: false },
				},
			} as any);

			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: true });

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(validateItemAccess).toHaveBeenCalled();
			expect(mockRoom.join).toHaveBeenCalledWith(mockClient, undefined);
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
		});

		test('creates room and joins client on success (singleton collection)', async () => {
			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					settings: {
						primary: 'id',
						collection: 'settings',
						singleton: true,
						fields: { title: { field: 'title' } },
					},
				},
				relations: [],
			} as any);

			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: true });

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'settings' } as any);

			expect(validateItemAccess).toHaveBeenCalled();
			expect(handler.roomManager.createRoom).toHaveBeenCalledWith('settings', undefined, null, undefined);
			expect(mockRoom.join).toHaveBeenCalledWith(mockClient, undefined);
		});

		test('propagates version to validateItemAccess and createRoom', async () => {
			vi.mocked(getSchema).mockResolvedValue({ collections: { articles: {} }, relations: [] } as any);
			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: true });

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1, version: 'v1' } as any);

			expect(validateItemAccess).toHaveBeenCalledWith(
				expect.objectContaining({ collection: 'directus_versions', primaryKeys: ['v1'] }),
				expect.anything(),
			);

			expect(handler.roomManager.createRoom).toHaveBeenCalledWith('articles', 1, 'v1', undefined);
		});

		test('propagates color to room.join', async () => {
			vi.mocked(getSchema).mockResolvedValue({ collections: { articles: {} }, relations: [] } as any);
			vi.mocked(validateItemAccess).mockResolvedValue({ accessAllowed: true });

			const mockRoom = { join: vi.fn() };
			vi.mocked(handler.roomManager.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, {
				action: 'join',
				collection: 'articles',
				item: 1,
				color: 'purple',
			} as any);

			expect(mockRoom.join).toHaveBeenCalledWith(mockClient, 'purple');
		});
	});

	describe('onFocus', () => {
		test('rejects if room does not exist', async () => {
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(undefined);

			await expect(
				handler.onFocus(mockClient, { action: 'focus', room: 'invalid-room', field: 'title' } as any),
			).rejects.toHaveProperty('extensions.reason', 'No access to room invalid-room or room does not exist');
		});

		test('rejects if client is not in room', async () => {
			const mockRoom = { hasClient: vi.fn().mockResolvedValue(false) };
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any),
			).rejects.toHaveProperty('extensions.reason', 'No access to room room-uid or room does not exist');
		});

		test('rejects if field read or update permission is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(verifyPermissions).mockResolvedValue(['id']); // only 'id' allowed

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/No permission to focus on field/i));
		});

		test('rejects if field is already focused by another', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				focus: vi.fn().mockResolvedValue(false),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/already focused by another user/i));
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
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
		});
	});

	describe('onUpdate', () => {
		test('implicitly switches focus if client is not focused on the field', async () => {
			let currentFocus = 'other-field';

			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockImplementation(async () => currentFocus),
				focus: vi.fn().mockImplementation(async (_client, field) => {
					currentFocus = field;
					return true;
				}),
				update: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { primary: 'id', collection: 'articles', fields: { title: { field: 'title' } } },
				},
				relations: [],
			} as any);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'test',
			} as any);

			expect(mockRoom.focus).toHaveBeenCalledWith(mockClient, 'title');
			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { title: 'test' });
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
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

			await expect(
				handler.onUpdate(mockClient, {
					action: 'update',
					room: 'room-uid',
					field: 'title',
					changes: 'test',
				} as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/No permission to update field title/i));
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
					articles: { primary: 'id', collection: 'articles', fields: { title: { field: 'title' } } },
				},
				relations: [],
			} as any);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onUpdate(mockClient, {
					action: 'update',
					room: 'room-uid',
					field: 'random_field',
					changes: 'test',
				} as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/field does not exist/i));
		});

		test('handles error in update gracefully', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				update: vi.fn().mockRejectedValue(new Error('Update failed')),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(getSchema).mockResolvedValue({
				collections: {
					articles: { primary: 'id', collection: 'articles', fields: { title: { field: 'title' } } },
				},
				relations: [],
			} as any);

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onUpdate(mockClient, {
					action: 'update',
					room: 'room-uid',
					field: 'title',
					changes: 'new value',
				} as any),
			).rejects.toThrow('Update failed');

			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { title: 'new value' });
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
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
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

			await expect(
				handler.onUpdateAll(mockClient, {
					action: 'update_all',
					room: 'room-uid',
					changes: { title: 'New', secret: 'Hack' },
				} as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/No permission to update field secret/i));
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
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
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

			await expect(
				handler.onLeave(mockClient, { action: 'leave', room: 'invalid-room', type: 'collab' }),
			).rejects.toHaveProperty(
				'extensions.reason',
				expect.stringMatching(/No access to room "invalid-room" or it does not exist/i),
			);
		});
	});

	describe('onDiscard', () => {
		test('rejects if room does not exist', async () => {
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(undefined);

			await expect(
				handler.onDiscard(mockClient, { action: 'discard', room: 'invalid-room', fields: ['title'] } as any),
			).rejects.toHaveProperty('extensions.reason', 'No access to room invalid-room or room does not exist');
		});

		test('rejects if client is not in room', async () => {
			const mockRoom = { hasClient: vi.fn().mockResolvedValue(false) };
			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);

			await expect(
				handler.onDiscard(mockClient, { action: 'discard', room: 'room-uid', fields: ['title'] } as any),
			).rejects.toHaveProperty('extensions.reason', 'No access to room room-uid or room does not exist');
		});

		test('rejects if field missing update permission', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(verifyPermissions).mockResolvedValue(['id']);

			await expect(
				handler.onDiscard(mockClient, { action: 'discard', room: 'room-uid', fields: ['title'] } as any),
			).rejects.toHaveProperty('extensions.reason', expect.stringMatching(/No permission to discard field/i));
		});

		test('calls room.discard on success', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				discard: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.roomManager.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			await handler.onDiscard(mockClient, { action: 'discard', room: 'room-uid', fields: ['title'] } as any);

			expect(mockRoom.discard).toHaveBeenCalledWith(['title']);
			expect(handler.messenger.handleError).not.toHaveBeenCalled();
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
			vi.mocked(handler.roomManager.getAllRoomClients).mockResolvedValue([]);
			vi.mocked(handler.roomManager.getClientRooms).mockResolvedValue([]);

			await cleanupJob();

			expect(handler.roomManager.getRoom).toHaveBeenCalledWith(mockDeadRoomUid);
			expect(mockRoom.leave).toHaveBeenCalledWith(mockDeadClientUid);
			expect(mockRoom.close).toHaveBeenCalled();
		});
	});

	describe('Distributed Event Handling', () => {
		let busCallback: (event: any) => void;

		beforeEach(() => {
			const subscribeMock = vi.mocked(handler.messenger.messenger.subscribe);
			busCallback = subscribeMock.mock.calls.find((call) => call[0] === 'websocket.event')![1];
		});

		test('normalizes single "key" into "keys" array', async () => {
			const mockRoom = { onUpdateHandler: vi.fn(), uid: 'room-uid' };
			handler.roomManager.rooms['articles_1_null'] = mockRoom as any;

			busCallback({
				collection: 'articles',
				action: 'update',
				key: 1,
			});

			expect(mockRoom.onUpdateHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					keys: [1],
				}),
			);
		});

		test('normalizes "payload" into "keys" for delete actions', async () => {
			const mockRoom = { onDeleteHandler: vi.fn(), uid: 'room-uid' };
			handler.roomManager.rooms['articles_1_null'] = mockRoom as any;

			busCallback({
				collection: 'articles',
				action: 'delete',
				payload: [1],
			});

			expect(mockRoom.onDeleteHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					keys: [1],
				}),
			);
		});

		test('forwards version updates to all versioned rooms', async () => {
			const mockRoom1 = { version: 'v1', onUpdateHandler: vi.fn(), uid: 'room-1' };
			const mockRoom2 = { version: 'v2', onUpdateHandler: vi.fn(), uid: 'room-2' };

			handler.roomManager.rooms['room1'] = mockRoom1 as any;
			handler.roomManager.rooms['room2'] = mockRoom2 as any;

			busCallback({
				collection: 'directus_versions',
				action: 'update',
				keys: ['v1'],
			});

			expect(mockRoom1.onUpdateHandler).toHaveBeenCalled();
			expect(mockRoom2.onUpdateHandler).not.toHaveBeenCalled();
		});

		test('disables collaboration via bus settings update', async () => {
			vi.mocked(SettingsService).mockImplementationOnce(
				() =>
					({
						readSingleton: vi.fn().mockResolvedValue({ collaboration: false }),
					}) as any,
			);

			handler.enabled = true;
			const terminateSpy = vi.spyOn(handler.roomManager, 'terminateAll');

			// Avoid setInterval infinite loop
			vi.useRealTimers();

			busCallback({
				collection: 'directus_settings',
				action: 'update',
				payload: { collaboration: false },
			});

			// Wait for initialize() to complete
			let attempts = 0;

			while (handler.enabled === true && attempts < 10) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}

			expect(handler.enabled).toBe(false);
			expect(terminateSpy).toHaveBeenCalled();

			vi.useFakeTimers();
		});

		test('enables collaboration via bus settings update', async () => {
			vi.mocked(SettingsService).mockImplementationOnce(
				() =>
					({
						readSingleton: vi.fn().mockResolvedValue({ collaboration: true }),
					}) as any,
			);

			handler.enabled = false;

			// Avoid setInterval infinite loop
			vi.useRealTimers();

			busCallback({
				collection: 'directus_settings',
				action: 'update',
				payload: { collaboration: true },
			});

			// Wait for initialize() to complete
			let attempts = 0;

			while (handler.enabled === false && attempts < 10) {
				await new Promise((resolve) => setTimeout(resolve, 50));
				attempts++;
			}

			expect(handler.enabled).toBe(true);

			vi.useFakeTimers();
		});

		test('ignores unknown collections or actions', async () => {
			const terminateSpy = vi.spyOn(handler.roomManager, 'terminateAll');

			busCallback({
				collection: 'unknown',
				action: 'unknown',
			});

			expect(terminateSpy).not.toHaveBeenCalled();
		});
	});

	describe('Concurrency and Locking', () => {
		test('initialize(true) does NOT replace the boot promise', async () => {
			const initialPromise = handler['initialized'];
			await handler.initialize(true);
			const newPromise = handler['initialized'];

			expect(newPromise).toBe(initialPromise);
		});

		test('ensureEnabled() does NOT wait for refreshed initialization', async () => {
			vi.useRealTimers();

			let resolveInit: (value: any) => void;

			const initStarted = new Promise((resolve) => {
				resolveInit = resolve;
			});

			vi.mocked(SettingsService).mockImplementationOnce(
				() =>
					({
						readSingleton: () => initStarted,
					}) as any,
			);

			const refreshPromise = handler.initialize(true);

			let ensureFinished = false;

			// Should return immediately because it only waits for the initial boot
			handler.ensureEnabled().then(() => {
				ensureFinished = true;
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			// ensureEnabled() must have finished even though the refresh is still pending
			expect(ensureFinished).toBe(true);

			// Cleanup
			resolveInit!({ collaboration: true });
			await refreshPromise;
			vi.useFakeTimers();
		});

		test('gracefully handles service failure during initialization', async () => {
			vi.mocked(SettingsService).mockImplementation(
				() =>
					({
						readSingleton: vi.fn().mockRejectedValue(new Error()),
					}) as any,
			);

			handler.enabled = true;
			await handler.initialize(true);
			expect(handler.enabled).toBe(true);

			handler.enabled = false;
			await handler.initialize(true);
			expect(handler.enabled).toBe(false);
		});

		test('bus subscriber is non-blocking and not stall bus processing', async () => {
			const subscribeMock = vi.mocked(handler.messenger.messenger.subscribe);
			const busCallback = subscribeMock.mock.calls.find((call) => call[0] === 'websocket.event')![1];

			let resolveInit: (value: any) => void;

			const initStuck = new Promise((resolve) => {
				resolveInit = resolve;
			});

			// Mock a slow initialization triggered by a settings update
			vi.mocked(SettingsService).mockImplementationOnce(
				() =>
					({
						readSingleton: () => initStuck,
					}) as any,
			);

			const event = {
				collection: 'directus_settings',
				action: 'update',
				payload: { collaboration: false },
			};

			let busHandlerFinished = false;

			const promise = (async () => {
				busCallback(event);
				busHandlerFinished = true;
			})();

			// Bus handler should return and not await
			expect(busHandlerFinished).toBe(true);

			// Cleanup
			resolveInit!({ collaboration: false });
			await promise;
		});
	});
});
