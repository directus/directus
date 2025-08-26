import type { Accountability, Relation, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { RelationsService } from '../../services/relations.js';
import { relations } from './relations.js';

vi.mock('../../services/relations.js');

vi.mock('../../utils/get-snapshot.js', () => ({
	getSnapshot: vi.fn(),
}));

describe('relations tool ', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user', admin: true } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('file operations', () => {
		let mockRelationsService: {
			createOne: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readAll: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			deleteOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockRelationsService = {
				createOne: vi.fn(),
				readOne: vi.fn(),
				readAll: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			};

			vi.mocked(RelationsService).mockImplementation(() => mockRelationsService as unknown as RelationsService);
		});

		describe('CREATE action', () => {
			test('should create a relation', async () => {
				const relationData = {
					collection: 'articles',
					field: 'category_id',
					related_collection: 'categories',
				} as Relation;

				mockRelationsService.createOne.mockResolvedValue([1]);
				mockRelationsService.readOne.mockResolvedValue([relationData]);

				const result = await relations.handler({
					args: {
						action: 'create',
						collection: 'articles',
						data: relationData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(RelationsService).toHaveBeenCalledWith({
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({ type: 'text', data: [relationData] });
			});
		});

		describe('READ action', () => {
			test('should read relation by field', async () => {
				const collection = 'articles';
				const field = 'category_id';
				const expectedRelations = { collection, field, related_collection: 'categories' };
				mockRelationsService.readOne.mockResolvedValue(expectedRelations);

				const result = await relations.handler({
					args: {
						collection,
						field,
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockRelationsService.readOne).toHaveBeenCalledWith(collection, field);
				expect(mockRelationsService.readAll).not.toHaveBeenCalled();
				expect(result).toEqual({ type: 'text', data: expectedRelations });
			});

			test('should read relations', async () => {
				const expectedRelations = [
					{ collection: 'articles', field: 'category_id', related_collection: 'categories' },
					{ collection: 'articles', field: 'author_id', related_collection: 'users' },
				];

				mockRelationsService.readAll.mockResolvedValue(expectedRelations);

				const result = await relations.handler({
					args: {
						collection: 'articles',
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockRelationsService.readAll).toHaveBeenCalled();
				expect(result).toEqual({ type: 'text', data: expectedRelations });
			});
		});

		describe('UPDATE action', () => {
			test('should update relation by field', async () => {
				const collection = 'articles';
				const field = 'category_id';

				const updateData = {
					meta: { one_field: 'updated_field' },
				} as Relation;

				const expectedResult = {
					collection,
					field,
					related_collection: 'categories',
					meta: { one_field: 'updated_field' },
				};

				mockRelationsService.readOne.mockResolvedValue(expectedResult);

				const result = await relations.handler({
					args: {
						collection,
						field,
						action: 'update',
						data: updateData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockRelationsService.updateOne).toHaveBeenCalledWith(collection, field, updateData);
				expect(result).toEqual({ type: 'text', data: expectedResult });
			});
		});

		describe('DELETE action', () => {
			test('should delete relation by collection + field', async () => {
				const collection = 'articles';
				const field = 'category_id';

				const result = await relations.handler({
					args: {
						collection,
						field,
						action: 'delete',
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockRelationsService.deleteOne).toHaveBeenCalledWith(collection, field);
				expect(result).toEqual({ type: 'text', data: { collection, field } });
			});
		});
	});

	describe('error handling', () => {
		test('should throw error for invalid action', async () => {
			await expect(
				relations.handler({
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
		test('should have correct tool name', () => {
			expect(relations.name).toBe('relations');
		});

		test('should be admin tool', () => {
			expect(relations.admin).toBe(true);
		});

		test('should have description', () => {
			expect(relations.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(relations.inputSchema).toBeDefined();
			expect(relations.validateSchema).toBeDefined();
		});
	});
});
