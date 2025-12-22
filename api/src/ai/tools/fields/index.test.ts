import type { Accountability, Field, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { FieldsService } from '../../../services/fields.js';
import { fields } from './index.js';

vi.mock('../../../services/fields.js');

vi.mock('../../../utils/get-schema.js', () => {
	return { getSchema: vi.fn() };
});

vi.mock('../../../database/index.js', () => {
	const self: Record<string, any> = {
		transaction: vi.fn((cb) => cb(self)),
	};

	return { default: vi.fn(() => self), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

describe('fields tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user', admin: true } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('field operations', () => {
		let mockFieldsService: {
			createField: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readAll: MockedFunction<any>;
			updateField: MockedFunction<any>;
			deleteField: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFieldsService = {
				createField: vi.fn(),
				readOne: vi.fn(),
				readAll: vi.fn(),
				updateField: vi.fn(),
				deleteField: vi.fn(),
			};

			vi.mocked(FieldsService).mockImplementation(() => mockFieldsService as unknown as FieldsService);
		});

		describe('CREATE action', () => {
			test('should create a field', async () => {
				const fieldData = {
					field: 'title',
					type: 'string',
					collection: 'articles',
					meta: { required: true },
				} as Field;

				mockFieldsService.readOne.mockResolvedValue(fieldData);

				const result = await fields.handler({
					args: {
						action: 'create',
						collection: 'articles',
						data: fieldData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(FieldsService).toHaveBeenCalledWith({
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({ type: 'text', data: [fieldData] });
			});
		});

		describe('READ action', () => {
			test('should read fields', async () => {
				const expectedFields = [
					{ field: 'title', type: 'string', collection: 'articles' },
					{ field: 'content', type: 'text', collection: 'articles' },
				];

				mockFieldsService.readAll.mockResolvedValue(expectedFields);

				const result = await fields.handler({
					args: {
						collection: 'articles',
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({ type: 'text', data: expectedFields });
			});

			test('should read field by field name', async () => {
				const expectedField = { field: 'title', type: 'string', collection: 'articles' };

				mockFieldsService.readOne.mockResolvedValue(expectedField);

				const result = await fields.handler({
					args: {
						collection: 'articles',
						field: 'title',
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFieldsService.readOne).toHaveBeenCalledWith(expectedField.collection, expectedField.field);

				expect(result).toEqual({ type: 'text', data: expectedField });
			});
		});

		describe('UPDATE action', () => {
			test('should update field by field', async () => {
				const collection = 'articles';

				const updateData = {
					field: 'title',
					meta: { required: false, note: 'Updated field note' },
				} as Field;

				const expectedResult = [
					{
						field: 'title',
						type: 'string',
						collection,
						meta: { required: false, note: 'Updated field note' },
					},
				];

				mockFieldsService.readOne.mockImplementation((collection, field) =>
					expectedResult.find((f) => f.collection === collection && f.field === field),
				);

				const result = await fields.handler({
					args: {
						action: 'update',
						collection,
						data: [updateData],
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFieldsService.updateField).toHaveBeenCalledOnce();

				expect(mockFieldsService.updateField).toHaveBeenCalledWith(collection, updateData, {
					autoPurgeCache: false,
					autoPurgeSystemCache: false,
				});

				expect(result).toEqual({ type: 'text', data: expectedResult });
			});

			test('should update field by fields', async () => {
				const collection = 'articles';

				const updateData = [
					{
						field: 'title',
						meta: { required: false, note: 'Updated field note' },
					},
					{
						field: 'subtitle',
						meta: { required: false, note: 'Updated field note' },
					},
				] as Field[];

				const expectedResult = [
					{
						field: 'title',
						type: 'string',
						collection,
						meta: { required: false, note: 'Updated field note' },
					},
					{
						field: 'subtitle',
						type: 'string',
						collection,
						meta: { required: false, note: 'Updated field note' },
					},
				];

				mockFieldsService.readOne.mockImplementation((collection, field) => {
					return expectedResult.find((f) => f.collection === collection && f.field === field);
				});

				const result = await fields.handler({
					args: {
						action: 'update',
						collection,
						data: updateData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFieldsService.updateField).toHaveBeenNthCalledWith(1, collection, updateData[0], {
					autoPurgeCache: false,
					autoPurgeSystemCache: false,
				});

				expect(mockFieldsService.updateField).toHaveBeenNthCalledWith(2, collection, updateData[1], {
					autoPurgeCache: false,
					autoPurgeSystemCache: false,
				});

				expect(result).toEqual({ type: 'text', data: expectedResult });
			});
		});

		describe('DELETE action', () => {
			test('should delete fields', async () => {
				const collection = 'articles';
				const fieldName = 'title';

				const result = await fields.handler({
					args: {
						action: 'delete',
						collection,
						field: fieldName,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFieldsService.deleteField).toHaveBeenCalledWith(collection, fieldName);

				expect(result).toEqual({
					type: 'text',
					data: {
						collection,
						field: fieldName,
					},
				});
			});
		});
	});

	describe('error handling', () => {
		test('should throw error for invalid action', async () => {
			await expect(
				fields.handler({
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
			expect(fields.name).toBe('fields');
		});

		test('should be admin tool', () => {
			expect(fields.admin).toBe(true);
		});

		test('should have description', () => {
			expect(fields.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(fields.inputSchema).toBeDefined();
			expect(fields.validateSchema).toBeDefined();
		});
	});
});
