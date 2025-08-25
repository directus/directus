import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { FilesService } from '../../services/files.js';
import { files } from './files.js';

vi.mock('../../services/files.js');

vi.mock('../tool.js', () => ({
	defineTool: vi.fn((config) => config),
}));

describe('files tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	beforeEach(() => {
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
			it('should read files by keys', async () => {
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFilesService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('UPDATE action', () => {
			it('should update files using keys', async () => {
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockFilesService.updateMany).toHaveBeenCalledWith(keys, updateData);

				expect(result).toEqual({
					type: 'text',
					data: expectedResult,
				});
			});
		});

		describe('DELETE action', () => {
			it('should delete files by keys', async () => {
				const keys = ['file-1', 'file-2'];

				mockFilesService.deleteMany.mockResolvedValue(keys);

				const result = await files.handler({
					args: {
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

	describe('error handling', () => {
		it('should throw error for invalid action', async () => {
			await expect(
				files.handler({
					args: {
						action: 'invalid' as any,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Invalid action.');
		});
	});

	describe('tool configuration', () => {
		it('should have correct tool name', () => {
			expect(files.name).toBe('files');
		});

		it('should have description', () => {
			expect(files.description).toBeDefined();
		});

		it('should have input and validation schemas', () => {
			expect(files.inputSchema).toBeDefined();
			expect(files.validateSchema).toBeDefined();
		});
	});
});
