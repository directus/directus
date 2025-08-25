import type { Accountability, File, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetsService } from '../../services/assets.js';
import { FilesService } from '../../services/files.js';
import { FoldersService } from '../../services/folders.js';
import { files } from './files.js';

// Mock the services
vi.mock('../../services/assets.js');
vi.mock('../../services/files.js');
vi.mock('../../services/folders.js');

// Mock the tool definition
vi.mock('../tool.js', () => ({
	defineTool: vi.fn((config) => config),
}));

describe('files tool', () => {
	const mockSchema = {} as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('folder operations', () => {
		let mockFoldersService: any;

		beforeEach(() => {
			mockFoldersService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readByQuery: vi.fn(),
				updateBatch: vi.fn(),
				updateMany: vi.fn(),
				updateByQuery: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(FoldersService).mockImplementation(() => mockFoldersService);
		});

		describe('create action', () => {
			it('should create a single folder and return the result', async () => {
				const folderData = { name: 'test-folder', parent: 'parent-id' };
				const savedKeys = ['folder-1'];
				const expectedResult = [{ id: 'folder-1', name: 'test-folder' }];

				mockFoldersService.createMany.mockResolvedValue(savedKeys);
				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'folder',
						action: 'create',
						data: folderData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(FoldersService).toHaveBeenCalledWith({
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.createMany).toHaveBeenCalledWith([folderData]);
				expect(mockFoldersService.readMany).toHaveBeenCalledWith(savedKeys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			it('should create multiple folders', async () => {
				const foldersData = [{ name: 'folder-1' }, { name: 'folder-2', parent: 'parent-id' }];

				const savedKeys = ['folder-1', 'folder-2'];

				mockFoldersService.createMany.mockResolvedValue(savedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await files.handler({
					args: {
						type: 'folder',
						action: 'create',
						data: foldersData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.createMany).toHaveBeenCalledWith(foldersData);
			});
		});

		describe('read action', () => {
			it('should read folders by keys', async () => {
				const keys = ['folder-1', 'folder-2'];
				const expectedResult = [{ id: 'folder-1' }, { id: 'folder-2' }];

				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'folder',
						action: 'read',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			it('should read folders by query when no keys provided', async () => {
				const expectedResult = [{ id: 'folder-1' }];

				mockFoldersService.readByQuery.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'folder',
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('update action', () => {
			it('should update folders using keys', async () => {
				const keys = ['folder-1'];
				const updateData = { name: 'updated-folder' };
				const expectedResult = [{ id: 'folder-1', name: 'updated-folder' }];

				mockFoldersService.updateMany.mockResolvedValue(keys);
				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'folder',
						action: 'update',
						data: updateData,
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.updateMany).toHaveBeenCalledWith(keys, updateData);
				expect(mockFoldersService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			it('should update folders using batch when data is array', async () => {
				const batchData = [{ id: 'folder-1', name: 'updated-1' }] as unknown as {
					id: '';
					name: string;
					parent?: string | undefined;
				};

				const updatedKeys = ['folder-1'];

				mockFoldersService.updateBatch.mockResolvedValue(updatedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await files.handler({
					args: {
						type: 'folder',
						action: 'update',
						data: batchData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.updateBatch).toHaveBeenCalledWith(batchData);
			});

			it('should update folders by query when no keys provided', async () => {
				const updateData = { name: 'updated-folder' };
				const updatedKeys = ['folder-1'];

				mockFoldersService.updateByQuery.mockResolvedValue(updatedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await files.handler({
					args: {
						type: 'folder',
						action: 'update',
						data: updateData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.updateByQuery).toHaveBeenCalledWith(mockSanitizedQuery, updateData);
			});
		});

		describe('delete action', () => {
			it('should delete folders by keys', async () => {
				const keys = ['folder-1', 'folder-2'];

				mockFoldersService.deleteMany.mockResolvedValue(keys);

				const result = await files.handler({
					args: {
						type: 'folder',
						action: 'delete',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFoldersService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});
		});
	});

	describe('file operations', () => {
		let mockFilesService: any;

		beforeEach(() => {
			mockFilesService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readByQuery: vi.fn(),
				updateBatch: vi.fn(),
				updateMany: vi.fn(),
				updateByQuery: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(FilesService).mockImplementation(() => mockFilesService);
		});

		describe('create action', () => {
			it('should create a file and return the result', async () => {
				const fileData = { filename_download: 'test.jpg', type: 'image/jpeg' } as unknown as File;
				const savedKeys = ['file-1'];
				const expectedResult = [{ id: 'file-1', filename_download: 'test.jpg' }];

				mockFilesService.createMany.mockResolvedValue(savedKeys);
				mockFilesService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'file',
						action: 'create',
						data: fileData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(FilesService).toHaveBeenCalledWith({
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFilesService.createMany).toHaveBeenCalledWith([fileData]);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('read action', () => {
			it('should read files by keys', async () => {
				const keys = ['file-1', 'file-2'];
				const expectedResult = [{ id: 'file-1' }, { id: 'file-2' }];

				mockFilesService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'file',
						action: 'read',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFilesService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('update action', () => {
			it('should update files using keys', async () => {
				const keys = ['file-1'];
				const updateData = { filename_download: 'updated.jpg' } as unknown as File;
				const expectedResult = [{ id: 'file-1', filename_download: 'updated.jpg' }];

				mockFilesService.updateMany.mockResolvedValue(keys);
				mockFilesService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						type: 'file',
						action: 'update',
						data: updateData,
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFilesService.updateMany).toHaveBeenCalledWith(keys, updateData);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('delete action', () => {
			it('should delete files by keys', async () => {
				const keys = ['file-1', 'file-2'];

				mockFilesService.deleteMany.mockResolvedValue(keys);

				const result = await files.handler({
					args: {
						type: 'file',
						action: 'delete',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFilesService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});
		});
	});

	describe('asset operations', () => {
		let mockAssetsService: any;

		beforeEach(() => {
			mockAssetsService = {
				getAsset: vi.fn(),
			};

			vi.mocked(AssetsService).mockImplementation(() => mockAssetsService);
		});

		describe('read action', () => {
			it('should read asset and return base64 encoded data', async () => {
				const assetId = 'asset-123';

				const mockChunks = [Buffer.from('chunk1'), Buffer.from('chunk2'), Buffer.from('chunk3')];

				// Create an async generator to simulate the stream
				async function* mockStream() {
					for (const chunk of mockChunks) {
						yield chunk;
					}
				}

				const mockAsset = {
					stream: mockStream(),
				};

				mockAssetsService.getAsset.mockResolvedValue(mockAsset);

				const result = await files.handler({
					args: {
						type: 'asset',
						action: 'read',
						id: assetId,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(AssetsService).toHaveBeenCalledWith({
					accountability: mockAccountability,
					schema: mockSchema,
				});

				expect(mockAssetsService.getAsset).toHaveBeenCalledWith(assetId);

				const expectedBuffer = Buffer.concat(mockChunks);

				expect(result).toEqual({
					type: 'image',
					data: expectedBuffer.toString('base64'),
					mimeType: 'image/png',
				});
			});

			it('should handle empty stream', async () => {
				const assetId = 'asset-123';

				async function* emptyStream() {
					// Empty generator
				}

				const mockAsset = {
					stream: emptyStream(),
				};

				mockAssetsService.getAsset.mockResolvedValue(mockAsset);

				const result = await files.handler({
					args: {
						type: 'asset',
						action: 'read',
						id: assetId,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'image',
					data: Buffer.concat([]).toString('base64'),
					mimeType: 'image/png',
				});
			});
		});
	});

	describe('error handling', () => {
		it('should throw error for invalid type', async () => {
			await expect(
				files.handler({
					args: {
						type: 'invalid' as any,
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Invalid type.');
		});

		it('should throw error for asset with non-read action', async () => {
			await expect(
				files.handler({
					args: {
						type: 'asset',
						action: 'create' as any,
						id: '12345',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Invalid type.');
		});
	});

	describe('tool configuration', () => {
		it('should have correct tool name', () => {
			expect(files.name).toBe('files');
		});

		it('should have description', () => {
			expect(files.description).toBeDefined();
			expect(files.description).toContain('CRUD operations on files and folders');
		});

		it('should have input and validation schemas', () => {
			expect(files.inputSchema).toBeDefined();
			expect(files.validateSchema).toBeDefined();
		});
	});

	describe('edge cases', () => {
		let mockFoldersService: any;

		beforeEach(() => {
			mockFoldersService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readByQuery: vi.fn(),
				updateMany: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(FoldersService).mockImplementation(() => mockFoldersService);
		});

		it('should handle null result from readMany after create', async () => {
			const folderData = { name: 'test-folder' };
			const savedKeys = ['folder-1'];

			mockFoldersService.createMany.mockResolvedValue(savedKeys);
			mockFoldersService.readMany.mockResolvedValue(null);

			const result = await files.handler({
				args: {
					type: 'folder',
					action: 'create',
					data: folderData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(result).toEqual({
				type: 'text',
				data: null,
			});
		});

		it('should handle service errors', async () => {
			const error = new Error('Service error');
			mockFoldersService.readByQuery.mockRejectedValue(error);

			await expect(
				files.handler({
					args: {
						type: 'folder',
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Service error');
		});
	});
});
