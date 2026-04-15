import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { FilesService } from '../../../services/files.js';
import { files, FilesValidateSchema } from './index.js';

vi.mock('../../../services/files.js');

describe('files tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('file operations', () => {
		let mockFilesService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			updateMany: MockedFunction<any>;
			updateByQuery: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

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

			vi.mocked(FilesService).mockImplementation(() => mockFilesService as unknown as FilesService);
		});

		describe('READ action', () => {
			test('should read files by keys', async () => {
				const keys = ['file-1', 'file-2'];
				const expectedResult = [{ id: 'file-1' }, { id: 'file-2' }];

				mockFilesService.readMany.mockResolvedValue(expectedResult);

				const result = await files.handler({
					args: {
						action: 'read',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFilesService.readMany).toHaveBeenCalledWith(keys, {});

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('UPDATE action', () => {
		test('should update files using keys with object data', async () => {
			const keys = ['file-1'];
			const updateData = { filename_download: 'updated.jpg' };
			const expectedResult = [{ id: 'file-1', filename_download: 'updated.jpg' }];

			mockFilesService.updateMany.mockResolvedValue(keys);
			mockFilesService.readMany.mockResolvedValue(expectedResult);

			const result = await files.handler({
				args: {
					action: 'update',
					data: updateData,
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(mockFilesService.updateMany).toHaveBeenCalledWith(keys, updateData);

			expect(result).toEqual({
				type: 'text',
				data: expectedResult,
			});
		});

		test('should update files using batch array data', async () => {
			const batchData = [
				{ id: 'file-1', title: 'Updated 1' },
				{ id: 'file-2', title: 'Updated 2' },
			];

			const expectedResult = [
				{ id: 'file-1', title: 'Updated 1' },
				{ id: 'file-2', title: 'Updated 2' },
			];

			mockFilesService.updateBatch.mockResolvedValue(['file-1', 'file-2']);
			mockFilesService.readMany.mockResolvedValue(expectedResult);

			const result = await files.handler({
				args: {
					action: 'update',
					data: batchData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(mockFilesService.updateBatch).toHaveBeenCalledWith(batchData);

			expect(result).toEqual({
				type: 'text',
				data: expectedResult,
			});
		});

		test('validation schema should accept object data for update', () => {
			const result = FilesValidateSchema.safeParse({
				action: 'update',
				data: { title: 'New Title', description: 'Some description' },
				keys: ['file-uuid'],
			});

			expect(result.success).toBe(true);
		});

		test('validation schema should accept array data for update', () => {
			const result = FilesValidateSchema.safeParse({
				action: 'update',
				data: [{ id: 'file-1', title: 'Updated' }],
			});

			expect(result.success).toBe(true);
		});
		});

		describe('DELETE action', () => {
			test('should delete files by keys', async () => {
				const keys = ['file-1', 'file-2'];

				mockFilesService.deleteMany.mockResolvedValue(keys);

				const result = await files.handler({
					args: {
						action: 'delete',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFilesService.deleteMany).toHaveBeenCalledWith(keys);

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
				files.handler({
					args: {
						action: 'invalid' as any,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid action.');
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(files.name).toBe('files');
		});

		test('should not be admin tool', () => {
			expect(files.admin).toBeUndefined();
		});

		test('should have description', () => {
			expect(files.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(files.inputSchema).toBeDefined();
			expect(files.validateSchema).toBeDefined();
		});
	});
});
