import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, it, test, vi, type MockedFunction } from 'vitest';
import { getSnapshot } from '../../utils/get-snapshot.js';
import { schema } from './schema.js';

vi.mock('../../utils/get-snapshot.js');

describe('schema tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user', admin: true } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	describe('overview', () => {
		let mockGetSnapshot: MockedFunction<any>;

		beforeEach(() => {
			mockGetSnapshot = vi.fn();
			vi.mocked(getSnapshot).mockImplementation(mockGetSnapshot);
		});

		describe('LIGHTWEIGHT', () => {
			test.each([undefined, []])('should return collections and folders when no keys provided', async (keys) => {
				const mockSnapshot = {
					collections: [
						{
							collection: 'users',
							schema: { name: 'users' },
							meta: { note: 'User data' },
						},
						{
							collection: 'posts',
							schema: { name: 'posts' },
							meta: null,
						},
						{
							collection: 'folder1',
							schema: null,
							meta: { note: 'A folder' },
						},
					],
					fields: [],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						collections: ['users', 'posts'],
						folders: ['folder1'],
						notes: {
							users: 'User data',
							folder1: 'A folder',
						},
					},
				});
			});

			it('should handle collections without notes', async () => {
				const mockSnapshot = {
					collections: [
						{
							collection: 'users',
							schema: { name: 'users' },
							meta: null,
						},
					],
					fields: [],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: {},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						collections: ['users'],
						folders: [],
						notes: {},
					},
				});
			});

			it('should handle folders', async () => {
				const mockSnapshot = {
					collections: [
						{
							collection: 'my_folder',
							schema: null,
							meta: null,
						},
					],
					fields: [],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: {},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						collections: [],
						folders: ['my_folder'],
						notes: {},
					},
				});
			});

			it('should handle empty collections array', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: {},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						collections: [],
						folders: [],
						notes: {},
					},
				});
			});
		});

		describe('DETAILED', () => {
			it('should return detailed field information for requested collections', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'id',
							type: 'integer',
							schema: { is_primary_key: true },
							meta: {
								required: true,
								readonly: false,
								note: 'Primary key',
								interface: 'input',
								options: null,
								special: null,
							},
						},
						{
							collection: 'users',
							field: 'name',
							type: 'string',
							schema: { is_primary_key: false },
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'input',
								options: null,
								special: null,
							},
						},
						{
							collection: 'posts',
							field: 'title',
							type: 'string',
							schema: { is_primary_key: false },
							meta: {
								required: true,
								readonly: false,
								note: null,
								interface: 'input',
								options: null,
								special: null,
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						users: {
							id: {
								type: 'integer',
								primary_key: true,
								required: true,
								note: 'Primary key',
								interface: {
									type: 'input',
								},
							},
							name: {
								type: 'string',
								interface: {
									type: 'input',
								},
							},
						},
					},
				});
			});

			it('should skip UI-only alias fields', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'id',
							type: 'integer',
							schema: { is_primary_key: true },
							meta: {
								required: true,
								readonly: false,
								note: null,
								interface: 'input',
								options: null,
								special: null,
							},
						},
						{
							collection: 'users',
							field: 'ui_field',
							type: 'alias',
							schema: null,
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'presentation-divider',
								options: null,
								special: ['no-data'],
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						users: {
							id: {
								type: 'integer',
								primary_key: true,
								required: true,
								interface: {
									type: 'input',
								},
							},
						},
					},
				});
			});

			it('should handle fields with choices', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'status',
							type: 'string',
							schema: { is_primary_key: false },
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'select-dropdown',
								options: {
									choices: [
										{ value: 'active', text: 'Active' },
										{ value: 'inactive', text: 'Inactive' },
									],
								},
								special: null,
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						users: {
							status: {
								type: 'string',
								interface: {
									type: 'select-dropdown',
									choices: ['active', 'inactive'],
								},
							},
						},
					},
				});
			});

			it('should process nested fields in JSON fields', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'metadata',
							type: 'json',
							schema: { is_primary_key: false },
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'list',
								options: {
									fields: [
										{
											field: 'name',
											type: 'string',
											meta: {
												required: true,
												interface: 'input',
											},
										},
										{
											field: 'value',
											type: 'string',
											meta: {
												interface: 'textarea',
											},
										},
									],
								},
								special: null,
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						users: {
							metadata: {
								type: 'json',
								interface: {
									type: 'list',
								},
								fields: {
									name: {
										type: 'string',
										required: true,
										interface: {
											type: 'input',
										},
									},
									value: {
										type: 'string',
										interface: {
											type: 'textarea',
										},
									},
								},
							},
						},
					},
				});
			});

			it('should handle deeply nested fields up to max depth', async () => {
				const createNestedField = (depth: number): any => ({
					field: `level${depth}`,
					type: 'json',
					meta: {
						interface: 'list',
						options: {
							fields: depth < 5 ? [createNestedField(depth + 1)] : [],
						},
					},
				});

				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'deep_metadata',
							type: 'json',
							schema: { is_primary_key: false },
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'list',
								options: {
									fields: [createNestedField(1)],
								},
								special: null,
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				let current = (result?.data as any).users.deep_metadata.fields.level1;

				for (let i = 2; i < 6; i++) {
					expect(current).toBeDefined();
					current = current.fields?.[`level${i}`];
				}

				expect(Object.keys(current?.fields ?? {}).length).eq(0);
			});

			it('should handle collection-item-dropdown interface', async () => {
				const mockSnapshot = {
					collections: [],
					fields: [
						{
							collection: 'users',
							field: 'favorite_post',
							type: 'json',
							schema: { is_primary_key: false },
							meta: {
								required: false,
								readonly: false,
								note: null,
								interface: 'collection-item-dropdown',
								options: {
									selectedCollection: 'posts',
								},
								special: null,
							},
						},
						{
							collection: 'posts',
							field: 'id',
							type: 'uuid',
							schema: { is_primary_key: true },
							meta: {
								required: true,
								readonly: false,
								note: null,
								interface: 'input',
								options: null,
								special: null,
							},
						},
					],
					relations: [],
				};

				mockGetSnapshot.mockResolvedValue(mockSnapshot);

				const result = await schema.handler({
					args: { keys: ['users'] },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'text',
					data: {
						users: {
							favorite_post: {
								fields: {
									collection: {
										value: 'posts',
										type: 'string',
									},
									key: {
										type: 'uuid',
									},
								},
								interface: {
									type: 'collection-item-dropdown',
								},
								type: 'json',
							},
						},
					},
				});
			});

			describe('relationships', () => {
				describe('Many-to-One (M2O)', () => {
					it('should build M2O relation info', async () => {
						const mockSnapshot = {
							collections: [],
							fields: [
								{
									collection: 'posts',
									field: 'author',
									type: 'uuid',
									schema: { foreign_key_table: 'users' },
									meta: {
										required: false,
										readonly: false,
										note: null,
										interface: 'select-dropdown-m2o',
										options: null,
										special: ['m2o'],
									},
								},
							],
							relations: [
								{
									collection: 'posts',
									field: 'author',
									related_collection: 'users',
									meta: null,
									schema: {
										table: 'posts',
										column: 'author',
										foreign_key_table: 'users',
										foreign_key_column: 'id',
									},
								},
							],
						};

						mockGetSnapshot.mockResolvedValue(mockSnapshot);

						const result = await schema.handler({
							args: { keys: ['posts'] },
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						});

						expect(result).toEqual({
							type: 'text',
							data: {
								posts: {
									author: {
										interface: {
											type: 'select-dropdown-m2o',
										},
										relation: {
											type: 'm2o',
											collection: 'users',
										},
										type: 'uuid',
									},
								},
							},
						});
					});
				});

				describe('One-to-Many (O2M)', () => {
					it('should build O2M relation info', async () => {
						const mockSnapshot = {
							collections: [],
							fields: [
								{
									collection: 'users',
									field: 'posts',
									type: 'alias',
									schema: null,
									meta: {
										required: false,
										readonly: false,
										note: null,
										interface: 'list-o2m',
										options: null,
										special: ['o2m'],
									},
								},
							],
							relations: [
								{
									collection: 'posts',
									field: 'author',
									related_collection: 'users',
									meta: {
										one_field: 'posts',
										one_collection: 'users',
									},
									schema: {
										table: 'posts',
										column: 'author',
										foreign_key_table: 'users',
										foreign_key_column: 'id',
									},
								},
							],
						};

						mockGetSnapshot.mockResolvedValue(mockSnapshot);

						const result = await schema.handler({
							args: { keys: ['users'] },
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						});

						expect(result).toEqual({
							type: 'text',
							data: {
								users: {
									posts: {
										interface: {
											type: 'list-o2m',
										},

										relation: {
											type: 'o2m',
											collection: 'posts',
											many_field: 'author',
										},
										type: 'alias',
									},
								},
							},
						});
					});
				});

				describe('Many-to-Many (M2M)', () => {
					it('should build M2M relation info', async () => {
						const mockSnapshot = {
							collections: [],
							fields: [
								{
									collection: 'users',
									field: 'roles',
									type: 'alias',
									schema: null,
									meta: {
										required: false,
										readonly: false,
										note: null,
										interface: 'list-m2m',
										options: null,
										special: ['m2m'],
									},
								},
							],
							relations: [
								{
									collection: 'users_roles',
									field: 'users_id',
									related_collection: 'users',
									meta: {
										one_field: 'roles',
										one_collection: 'users',
										junction_field: 'roles_id',
										sort_field: 'sort',
									},
									schema: {
										table: 'users_roles',
										column: 'users_id',
										foreign_key_table: 'users',
										foreign_key_column: 'id',
									},
								},
								{
									collection: 'users_roles',
									field: 'roles_id',
									related_collection: 'roles',
									meta: null,
									schema: {
										table: 'users_roles',
										column: 'roles_id',
										foreign_key_table: 'roles',
										foreign_key_column: 'id',
									},
								},
							],
						};

						mockGetSnapshot.mockResolvedValue(mockSnapshot);

						const result = await schema.handler({
							args: { keys: ['users'] },
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						});

						expect(result).toEqual({
							type: 'text',
							data: {
								users: {
									roles: {
										interface: {
											type: 'list-m2m',
										},
										relation: {
											type: 'm2m',
											collection: 'roles',
											junction: {
												collection: 'users_roles',
												many_field: 'users_id',
												junction_field: 'roles_id',
												sort_field: 'sort',
											},
										},
										type: 'alias',
									},
								},
							},
						});
					});

					it('should handle M2M with files', async () => {
						const mockSnapshot = {
							collections: [],
							fields: [
								{
									collection: 'posts',
									field: 'images',
									type: 'alias',
									schema: null,
									meta: {
										required: false,
										readonly: false,
										note: null,
										interface: 'files',
										options: null,
										special: ['files'],
									},
								},
							],
							relations: [
								{
									collection: 'posts_files',
									field: 'posts_id',
									related_collection: 'posts',
									meta: {
										one_field: 'images',
										one_collection: 'posts',
										junction_field: 'directus_files_id',
									},
									schema: {
										table: 'posts_files',
										column: 'posts_id',
										foreign_key_table: 'posts',
										foreign_key_column: 'id',
									},
								},
							],
						};

						mockGetSnapshot.mockResolvedValue(mockSnapshot);

						const result = await schema.handler({
							args: { keys: ['posts'] },
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						});

						expect(result).toEqual({
							type: 'text',
							data: {
								posts: {
									images: {
										interface: {
											type: 'files',
										},
										relation: {
											type: 'm2m',
											collection: 'directus_files',
											junction: {
												collection: 'posts_files',
												many_field: 'posts_id',
												junction_field: 'directus_files_id',
											},
										},
										type: 'alias',
									},
								},
							},
						});
					});
				});

				describe('Many-to-Any (M2A)', () => {
					it('should build M2A relation info', async () => {
						const mockSnapshot = {
							collections: [],
							fields: [
								{
									collection: 'comments',
									field: 'commentable',
									type: 'alias',
									schema: null,
									meta: {
										required: false,
										readonly: false,
										note: null,
										interface: 'list-m2a',
										options: null,
										special: ['m2a'],
									},
								},
							],
							relations: [
								{
									collection: 'comments_relations',
									field: 'comments_id',
									related_collection: 'comments',
									meta: {
										one_field: 'commentable',
										one_collection: 'comments',
									},
									schema: {
										table: 'comments_relations',
										column: 'comments_id',
										foreign_key_table: 'comments',
										foreign_key_column: 'id',
									},
								},
								{
									collection: 'comments_relations',
									field: 'item',
									related_collection: null,
									meta: {
										one_allowed_collections: ['posts', 'pages'],
										one_collection_field: 'collection',
										sort_field: 'sort',
									},
									schema: {
										table: 'comments_relations',
										column: 'item',
										foreign_key_table: null,
										foreign_key_column: 'id',
									},
								},
							],
						};

						mockGetSnapshot.mockResolvedValue(mockSnapshot);

						const result = await schema.handler({
							args: { keys: ['comments'] },
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						});

						expect(result).toEqual({
							type: 'text',
							data: {
								comments: {
									commentable: {
										interface: {
											type: 'list-m2a',
										},
										relation: {
											type: 'm2a',
											one_allowed_collections: ['posts', 'pages'],
											junction: {
												collection: 'comments_relations',
												many_field: 'comments_id',
												junction_field: 'item',
												one_collection_field: 'collection',
												sort_field: 'sort',
											},
										},
										type: 'alias',
									},
								},
							},
						});
					});
				});
			});
		});
	});

	describe('tool configuration', () => {
		it('should have correct tool name', () => {
			expect(schema.name).toBe('schema');
		});

		it('should have description', () => {
			expect(schema.description).toBeDefined();
		});

		it('should have input and validation schemas', () => {
			expect(schema.inputSchema).toBeDefined();
			expect(schema.validateSchema).toBeDefined();
		});
	});
});
