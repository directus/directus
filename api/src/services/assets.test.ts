import { ForbiddenError } from '@directus/errors';
import { Driver, StorageManager } from '@directus/storage';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import { PassThrough } from 'node:stream';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from 'vitest';
import { fetchAllowedFields } from '../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { getStorage } from '../storage/index.js';
import { AssetsService } from './assets.js';
import { FilesService } from './files.js';

vi.mock('../storage/index.js');
vi.mock('@directus/storage');
vi.mock('../permissions/modules/validate-access/validate-access.js');
vi.mock('../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');
vi.mock('./files.js');

describe('Services / Assets', () => {
  let db: MockedFunction<Knex>;
  let tracker: Tracker;

  const mockFileId = 'eff91c4f-535d-4be8-b499-8af62588d26b';

  const mockFile = {
    id: mockFileId,
    storage: 'local',
    filename_disk: 'test-file.pdf',
    filename_download: 'my-document.pdf',
    type: 'application/pdf',
    title: 'My Document',
    description: 'A test document',
    width: 1920,
    height: 1080,
    filesize: 9156,
    modified_on: '2025-09-23T19:31:49.000Z',
  };

  const createAssetsService = (accountability: Accountability) => {
    return new AssetsService({
      knex: db,
      schema: { collections: {}, relations: [] },
      accountability,
    });
  };

  beforeAll(() => {
    db = vi.mocked(knex.default({ client: MockClient }));
    tracker = createTracker(db);
  });

  beforeEach(() => {
    tracker.on.select(/directus_settings/).response([{}]);
  });

  afterEach(() => {
    tracker.reset();
    vi.clearAllMocks();
  });

  describe('getAsset', () => {
    let service: AssetsService;
    let mockDriver: Partial<Driver>;
    let mockStorage: Partial<StorageManager>;

    beforeEach(() => {
      // Mock storage
      mockDriver = {
        exists: vi.fn().mockResolvedValue(true),
        read: vi.fn().mockResolvedValue(new PassThrough()),
        stat: vi.fn().mockResolvedValue({ size: mockFile.filesize }),
      };

      mockStorage = {
        location: vi.fn(() => mockDriver as Driver),
      };

      vi.mocked(getStorage).mockResolvedValue(mockStorage as StorageManager);

      // Mock validateAccess
      vi.mocked(validateAccess).mockResolvedValue(undefined);
    });

    describe('field filtering for non-admin users', () => {
      it('should filter out fields that the user does not have permission to see', async () => {
        const accountability: Accountability = {
          user: 'test-user-id',
          role: 'test-role-id',
          roles: ['test-role-id'],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

        vi.mocked(fetchAllowedFields).mockResolvedValue([
          'id',
          'type',
          'title',
        ]);

        const result = await service.getAsset(mockFileId);

        expect(result.file.type).toBe(mockFile.type);
        expect(result.file.filename_download).toBeUndefined();
        expect(result.file.title).toBe(mockFile.title);
      });



      it('should keep all fields when user has full access (*)', async () => {
        const accountability: Accountability = {
          user: 'test-user-id',
          role: 'test-role-id',
          roles: ['test-role-id'],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

        vi.mocked(fetchAllowedFields).mockResolvedValue(['*']);

        const result = await service.getAsset(mockFileId);

        expect(result.file).toEqual(mockFile);
      });
    });

    describe('admin users', () => {
      it('should not filter any fields for admin users', async () => {
        const accountability: Accountability = {
          user: 'admin-user-id',
          role: 'admin-role-id',
          roles: ['admin-role-id'],
          admin: true,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

        const result = await service.getAsset(mockFileId);

        expect(result.file).toEqual(mockFile);

        expect(fetchAllowedFields).not.toHaveBeenCalled();
      });
    });

    describe('system public assets', () => {
      it('should not filter fields for system public assets (logo, favicon, etc.)', async () => {
        const logoFileId = '550e8400-e29b-41d4-a716-446655440000';

        const accountability: Accountability = {
          user: null,
          role: null,
          roles: [],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        tracker.reset();
        tracker.on.select(/directus_settings/).response([{ project_logo: logoFileId }]);

        const logoFile = { ...mockFile, id: logoFileId } as any;
        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(logoFile);

        const result = await service.getAsset(logoFileId);

        expect(result.file).toEqual(logoFile);

        expect(validateAccess).not.toHaveBeenCalled();

        expect(fetchAllowedFields).not.toHaveBeenCalled();
      });
    });

    describe('access validation', () => {
      it('should call validateAccess with correct parameters', async () => {
        const accountability: Accountability = {
          user: 'test-user-id',
          role: 'test-role-id',
          roles: ['test-role-id'],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);
        vi.mocked(fetchAllowedFields).mockResolvedValue(['*']);

        await service.getAsset(mockFileId);

        expect(validateAccess).toHaveBeenCalledWith(
          {
            accountability,
            action: 'read',
            collection: 'directus_files',
            primaryKeys: [mockFileId],
          },
          expect.objectContaining({
            knex: db,
            schema: expect.anything(),
          }),
        );
      });

      it('should throw ForbiddenError if validateAccess throws', async () => {
        const accountability: Accountability = {
          user: 'test-user-id',
          role: 'test-role-id',
          roles: ['test-role-id'],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(validateAccess).mockRejectedValue(new ForbiddenError());

        await expect(service.getAsset(mockFileId)).rejects.toThrow(ForbiddenError);
      });

      it('should throw ForbiddenError if file does not exist in storage', async () => {
        const accountability: Accountability = {
          user: 'test-user-id',
          role: 'test-role-id',
          roles: ['test-role-id'],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);
        vi.mocked(mockDriver.exists as any).mockResolvedValue(false);

        await expect(service.getAsset(mockFileId)).rejects.toThrow(ForbiddenError);
      });
    });

    describe('unauthenticated access', () => {
      it('should filter fields for unauthenticated users based on public permissions', async () => {
        const accountability: Accountability = {
          user: null,
          role: null,
          roles: [],
          admin: false,
          app: false,
          ip: '127.0.0.1',
        };

        service = createAssetsService(accountability);

        vi.mocked(FilesService.prototype.readOne).mockResolvedValue(mockFile as any);

        vi.mocked(fetchAllowedFields).mockResolvedValue(['id', 'type']);

        const result = await service.getAsset(mockFileId);

        expect(result.file.type).toBe(mockFile.type);
        expect(result.file.storage).toBe(mockFile.storage);
        expect(result.file.filename_disk).toBe(mockFile.filename_disk);

        expect(result.file.filename_download).toBeUndefined();
        expect(result.file.title).toBeUndefined();
        expect(result.file.description).toBeUndefined();
      });
    });
  });
});

