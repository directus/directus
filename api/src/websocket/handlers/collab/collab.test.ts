import { InvalidPayloadError } from '@directus/errors';
import { type WebSocketClient } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchAllowedCollections } from '../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getService } from '../../../utils/get-service.js';
import { isFieldAllowed } from '../../../utils/is-field-allowed.js';
import { handleWebSocketError } from '../../errors.js';
import { CollabHandler } from './collab.js';

vi.mock('../../../database/index.js');
vi.mock('../../../emitter.js');
vi.mock('../../../logger/index.js');
vi.mock('../../../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js');
vi.mock('../../../utils/get-schema.js');
vi.mock('../../../utils/get-service.js');
vi.mock('../../../utils/is-field-allowed.js');
vi.mock('../../../utils/schedule.js');
vi.mock('../../errors.js');
vi.mock('./messenger.js');
vi.mock('./room.js');

describe('CollabHandler', () => {
	let handler: CollabHandler;
	let mockClient: WebSocketClient;

	beforeEach(() => {
		vi.clearAllMocks();
		handler = new CollabHandler();

		mockClient = {
			uid: 'test-client',
			accountability: { user: 'test-user', role: 'test-role' },
			on: vi.fn(),
		} as any;
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
			vi.mocked(handler.rooms.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'articles', item: 1 } as any);

			expect(handler.rooms.createRoom).toHaveBeenCalledWith('articles', 1, null, undefined);
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
			vi.mocked(handler.rooms.createRoom).mockResolvedValue(mockRoom as any);

			await handler.onJoin(mockClient, { action: 'join', collection: 'settings' } as any);

			expect(mockService.readSingleton).toHaveBeenCalled();
			expect(handler.rooms.createRoom).toHaveBeenCalledWith('settings', undefined, null, undefined);
			expect(mockRoom.join).toHaveBeenCalledWith(mockClient);
		});
	});

	describe('onFocus', () => {
		test('rejects if room does not exist', async () => {
			vi.mocked(handler.rooms.getRoom).mockResolvedValue(undefined);

			await handler.onFocus(mockClient, { action: 'focus', room: 'invalid-room', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/room does not exist/);
		});

		test('rejects if client is not in room', async () => {
			const mockRoom = { hasClient: vi.fn().mockResolvedValue(false) };
			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/Not connected to room/);
		});

		test('rejects if field read or update permission is missing', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				verifyPermissions: vi.fn().mockResolvedValue(['id']), // only 'id' allowed
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(false);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to focus on field/);
		});

		test('rejects if field is already focused by another', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				verifyPermissions: vi.fn().mockResolvedValue(['*']),
				focus: vi.fn().mockResolvedValue(false),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(true);

			await handler.onFocus(mockClient, { action: 'focus', room: 'room-uid', field: 'title' } as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'focus');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/already focused by another user/);
		});

		test('calls room.focus on success', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				verifyPermissions: vi.fn().mockResolvedValue(['*']),
				focus: vi.fn().mockResolvedValue(true),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(true);

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

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);

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
				verifyPermissions: vi.fn().mockResolvedValue(['id']),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(false);

			await handler.onUpdate(mockClient, {
				action: 'update',
				room: 'room-uid',
				field: 'title',
				changes: 'test',
			} as any);

			expect(handleWebSocketError).toHaveBeenCalledWith(mockClient, expect.any(InvalidPayloadError), 'update');
			const error = vi.mocked(handleWebSocketError).mock.calls[0]![1] as any;
			expect(error.extensions['reason']).toMatch(/No permission to update field/);
		});

		test('calls room.update on success', async () => {
			const mockRoom = {
				hasClient: vi.fn().mockResolvedValue(true),
				getFocusByUser: vi.fn().mockResolvedValue('title'),
				verifyPermissions: vi.fn().mockResolvedValue(['*']),
				update: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(true);

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
				verifyPermissions: vi.fn().mockResolvedValue(['title']), // only 'title' allowed
				getFocusByField: vi.fn().mockResolvedValue(null),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockImplementation((allowed: any, field) => allowed.includes(field));

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
				verifyPermissions: vi.fn().mockResolvedValue(['*']),
				getFocusByField: vi.fn().mockImplementation((field) => (field === 'title' ? 'other-client' : null)),
				update: vi.fn(),
				collection: 'articles',
				item: 1,
			};

			vi.mocked(handler.rooms.getRoom).mockResolvedValue(mockRoom as any);
			vi.mocked(isFieldAllowed).mockReturnValue(true);

			await handler.onUpdateAll(mockClient, {
				action: 'update_all',
				room: 'room-uid',
				changes: { title: 'Ignored', content: 'Updated' },
			} as any);

			expect(mockRoom.update).toHaveBeenCalledWith(mockClient, { content: 'Updated' });
			expect(handleWebSocketError).not.toHaveBeenCalled();
		});
	});
});
