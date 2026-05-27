import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { FoldersService } from '../../../services/folders.js';
import { folders } from './index.js';

vi.mock('../../../services/folders.js');

describe('folders tool', () => {
	const mockSchema = {} as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('folder operations', () => {
		let mockFoldersService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			updateMany: MockedFunction<any>;
			updateByQuery: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

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

			vi.mocked(FoldersService).mockImplementation(() => mockFoldersService as unknown as FoldersService);
		});

		describe('CREATE action', () => {
			test('should create a single folder and return the result', async () => {
				const folderData = { name: 'test-folder', parent: 'parent-id' };
				const savedKeys = ['folder-1'];
				const expectedResult = [{ id: 'folder-1', name: 'test-folder' }];

				mockFoldersService.createMany.mockResolvedValue(savedKeys);
				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await folders.handler({
					args: {
						action: 'create',
						data: folderData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(FoldersService).toHaveBeenCalledWith({
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.createMany).toHaveBeenCalledWith([folderData]);
				expect(mockFoldersService.readMany).toHaveBeenCalledWith(savedKeys, {});

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			test('should create multiple folders', async () => {
				const foldersData = [{ name: 'folder-1' }, { name: 'folder-2', parent: 'parent-id' }];

				const savedKeys = ['folder-1', 'folder-2'];

				mockFoldersService.createMany.mockResolvedValue(savedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await folders.handler({
					args: {
						action: 'create',
						data: foldersData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.createMany).toHaveBeenCalledWith(foldersData);
			});
		});

		describe('READ action', () => {
			test('should read folders by keys', async () => {
				const keys = ['folder-1', 'folder-2'];
				const expectedResult = [{ id: 'folder-1' }, { id: 'folder-2' }];

				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await folders.handler({
					args: {
						action: 'read',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.readMany).toHaveBeenCalledWith(keys, {});
				expect(mockFoldersService.readByQuery).not.toHaveBeenCalled();

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			test('should read folders by query when no keys provided', async () => {
				const expectedResult = [{ id: 'folder-1' }];

				mockFoldersService.readByQuery.mockResolvedValue(expectedResult);

				const result = await folders.handler({
					args: {
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.readByQuery).toHaveBeenCalledWith({});
				expect(mockFoldersService.readMany).not.toHaveBeenCalled();

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('UPDATE action', () => {
			test('should update folders using keys', async () => {
				const keys = ['folder-1'];
				const updateData = { name: 'updated-folder' };
				const expectedResult = [{ id: 'folder-1', name: 'updated-folder' }];

				mockFoldersService.updateMany.mockResolvedValue(keys);
				mockFoldersService.readMany.mockResolvedValue(expectedResult);

				const result = await folders.handler({
					args: {
						action: 'update',
						data: updateData,
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.updateMany).toHaveBeenCalledWith(keys, updateData);
				expect(mockFoldersService.updateByQuery).not.toHaveBeenCalled();
				expect(mockFoldersService.updateBatch).not.toHaveBeenCalled();

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});

			test('should update folders using batch when data is array', async () => {
				const batchData = [{ id: 'folder-1', name: 'updated-1' }] as unknown as {
					id: '';
					name: string;
					parent?: string | undefined;
				};

				const updatedKeys = ['folder-1'];

				mockFoldersService.updateBatch.mockResolvedValue(updatedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await folders.handler({
					args: {
						action: 'update',
						data: batchData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.updateBatch).toHaveBeenCalledWith(batchData);
				expect(mockFoldersService.updateByQuery).not.toHaveBeenCalled();
				expect(mockFoldersService.updateMany).not.toHaveBeenCalled();
			});

			test('should update folders by query when no keys provided', async () => {
				const updateData = { name: 'updated-folder' };
				const updatedKeys = ['folder-1'];

				mockFoldersService.updateByQuery.mockResolvedValue(updatedKeys);
				mockFoldersService.readMany.mockResolvedValue([]);

				await folders.handler({
					args: {
						action: 'update',
						data: updateData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.updateByQuery).toHaveBeenCalledWith({}, updateData);
				expect(mockFoldersService.updateMany).not.toHaveBeenCalled();
				expect(mockFoldersService.updateMany).not.toHaveBeenCalled();
			});
		});

		describe('DELETE action', () => {
			test('should delete folders by keys', async () => {
				const keys = ['folder-1', 'folder-2'];

				mockFoldersService.deleteMany.mockResolvedValue(keys);

				const result = await folders.handler({
					args: {
						action: 'delete',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFoldersService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});
		});
	});

	describe('error handling', () => {
		test('should throw error for invalid action', async () => {
			await expect(
				folders.handler({
					args: {
						action: 'test' as any,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid action.');
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

		test('should handle null result from readMany after create', async () => {
			const folderData = { name: 'test-folder' };
			const savedKeys = ['folder-1'];

			mockFoldersService.createMany.mockResolvedValue(savedKeys);
			mockFoldersService.readMany.mockResolvedValue(null);

			const result = await folders.handler({
				args: {
					action: 'create',
					data: folderData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(result).toEqual({
				type: 'text',
				data: null,
			});
		});

		test('should handle service errors', async () => {
			const error = new Error('Service error');
			mockFoldersService.readByQuery.mockRejectedValue(error);

			await expect(
				folders.handler({
					args: {
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Service error');
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(folders.name).toBe('folders');
		});

		test('should not be admin tool', () => {
			expect(folders.admin).toBeUndefined();
		});

		test('should have description', () => {
			expect(folders.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(folders.inputSchema).toBeDefined();
			expect(folders.validateSchema).toBeDefined();
		});
	});
});
