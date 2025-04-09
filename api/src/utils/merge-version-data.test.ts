import { SchemaBuilder } from '@directus/schema-builder';
import { describe, expect, test } from 'vitest';
import { mergeVersionsRaw, mergeVersionsRecursive } from './merge-version-data.js';

describe('content versioning mergeVersionsRaw', () => {
	test('No versions available', () => {
		const result = mergeVersionsRaw({ test_field: 'value' }, []);

		expect(result).toMatchObject({ test_field: 'value' });
	});

	test('Basic field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', edited_field: 'original' }, [
			{ edited_field: 'updated' },
			{ test_field: null },
		]);

		expect(result).toMatchObject({
			test_field: null,
			edited_field: 'updated',
		});
	});

	test('Relational field versions', () => {
		const result = mergeVersionsRaw({ test_field: 'value', relation: null }, [
			{ relation: { create: [{ test: 'value ' }], update: [], delete: [] } },
		]);

		expect(result).toMatchObject({
			test_field: 'value',
			relation: {
				create: [{ test: 'value ' }],
				update: [],
				delete: [],
			},
		});
	});
});

describe('content versioning mergeVersionsRecursive', () => {
	const schema = new SchemaBuilder()
		.collection('collection_a', (c) => {
			c.field('id').id();

			c.field('status').string().options({
				defaultValue: 'draft',
			});

			c.field('m2o').m2o('collection_b', 'o2m');
			c.field('m2o_c').m2o('collection_c');
			c.field('m2m').m2m('collection_c');
			c.field('m2a').m2a(['collection_b', 'collection_c']);
		})
		.collection('collection_b', (c) => {
			c.field('id').id();

			c.field('status').string().options({
				defaultValue: 'draft',
			});
		})
		.collection('collection_c', (c) => {
			c.field('id').id();

			c.field('status').string().options({
				defaultValue: 'draft',
			});

			c.field('translations').translations();
		})
		.collection('collection_c_translations', (c) => {
			c.field('id').id();
			c.field('text').string();
		})
		.build();

	test('No versions available', () => {
		const result = mergeVersionsRecursive({ status: 'draft' }, [], 'collection_a', schema);

		expect(result).toMatchObject({ status: 'draft' });
	});

	describe('m2o field', () => {
		test('Setting m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: null },
				[{ status: 'published' }, { m2o: 1 }],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: 1 });
		});

		test('Unsetting m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: { id: 1, status: 'draft' } },
				[{ status: 'published', m2o: null }],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: null });
		});

		test('Updating m2o value', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', m2o: { id: 1, test: 'data', status: 'draft' } },
				[{ status: 'published' }, { m2o: { id: 1, status: 'published' } }],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({ id: 1, status: 'published', m2o: { id: 1, test: 'data', status: 'published' } });
		});
	});

	describe('o2m field', () => {
		test('Setting o2m values', () => {
			const result = mergeVersionsRecursive(
				{ id: 2, status: 'draft', o2m: [] },
				[
					{
						o2m: {
							create: [{ status: 'draft' }],
							update: [
								{
									m2o: '2',
									id: 2,
								},
								{
									m2o: '2',
									id: 3,
								},
							],
							delete: [],
						},
					},
				],
				'collection_b',
				schema,
			);

			expect(result).toMatchObject({
				id: 2,
				status: 'draft',
				o2m: [{ m2o: '2', id: 2 }, { m2o: '2', id: 3 }, { status: 'draft' }],
			});
		});

		test('Updating o2m values', () => {
			const result = mergeVersionsRecursive(
				{ id: 1, status: 'draft', o2m: [1, 2, 3, { id: 4, test: 'value' }, { id: 5 }] },
				[
					{
						status: 'published',
					},
					{
						o2m: {
							create: [
								{
									test: 'new',
								},
							],
							update: [
								{
									id: 1,
								},
								{
									id: 4,
								},
							],
							delete: [2, 5],
						},
					},
				],
				'collection_b',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				o2m: [
					{
						id: 1,
					},
					3,
					{
						id: 4,
						test: 'value',
					},
					{
						test: 'new',
					},
				],
			});
		});
	});

	describe('m2m field', () => {
		test('Adding related items', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2m: [],
				},
				[
					{
						status: 'published',
						m2m: {
							create: [
								{
									collection_c_id: {
										status: 'published',
									},
								},
								{
									collection_a_id: '1',
									collection_c_id: {
										id: 1,
									},
								},
							],
							update: [],
							delete: [],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2m: [
					{
						collection_c_id: {
							status: 'published',
						},
					},
					{
						collection_a_id: '1',
						collection_c_id: {
							id: 1,
						},
					},
				],
			});
		});

		test('Updating m2m values', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2m: [1, 2, 3, { id: 4 }, { id: 5 }],
				},
				[
					{
						status: 'published',
					},
					{
						m2m: {
							create: [
								{
									collection_c_id: {
										id: 3,
									},
								},
							],
							update: [
								{
									id: 1,
									collection_c_id: {
										id: 1,
									},
								},
								{
									id: 4,
									collection_c_id: {
										id: 2,
									},
								},
							],
							delete: [2, 5],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2m: [
					{
						collection_c_id: {
							id: 1,
						},
						id: 1,
					},
					3,
					{
						id: 4,
						collection_c_id: {
							id: 2,
						},
					},
					{
						collection_c_id: {
							id: 3,
						},
					},
				],
			});
		});
	});

	describe('m2a field', () => {
		test('Adding related items', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2a: [],
				},
				[
					{
						m2a: {
							create: [
								{
									collection_a_id: '1',
									collection: 'collection_b',
									item: {
										id: 2,
									},
								},
								{
									collection_a_id: '1',
									collection: 'collection_c',
									item: {
										id: 1,
									},
								},
								{
									collection: 'collection_b',
									item: {
										status: 'published',
									},
								},
								{
									collection: 'collection_c',
									item: {
										status: 'published',
									},
								},
							],
							update: [],
							delete: [],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'draft',
				m2a: [
					{
						collection_a_id: '1',
						collection: 'collection_b',
						item: {
							id: 2,
						},
					},
					{
						collection_a_id: '1',
						collection: 'collection_c',
						item: {
							id: 1,
						},
					},
					{
						collection: 'collection_b',
						item: {
							status: 'published',
						},
					},
					{
						collection: 'collection_c',
						item: {
							status: 'published',
						},
					},
				],
			});
		});

		test('Updating m2a values', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2a: [
						1,
						{
							id: 2,
							collection_a_id: 1,
							item: '1',
							collection: 'collection_c',
						},
						3,
						{ id: 4 },
						{
							id: 5,
							collection_a_id: 1,
							item: '1',
							collection: 'collection_b',
						},
					],
				},
				[
					{
						status: 'published',
					},
					{
						m2a: {
							create: [
								{
									collection: 'collection_c',
									item: {
										status: 'published',
									},
								},
							],
							update: [
								{
									collection: 'collection_b',
									item: {
										status: 'published',
										id: 1,
									},
									id: 1,
								},
								{
									collection: 'collection_b',
									item: {
										id: '2',
									},
									id: 5,
								},
							],
							delete: [2, 4],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'published',
				m2a: [
					{
						id: 1,
						item: {
							status: 'published',
							id: 1,
						},
						collection: 'collection_b',
					},
					3,
					{
						id: 5,
						collection_a_id: 1,
						item: {
							id: '2',
						},
						collection: 'collection_b',
					},
					{
						collection: 'collection_c',
						item: {
							status: 'published',
						},
					},
				],
			});
		});
	});

	describe('nested relations', () => {
		test('m2o > translation', () => {
			const result = mergeVersionsRecursive(
				{
					id: 1,
					status: 'draft',
					m2o_c: {
						id: 1,
						status: 'draft',
						translations: [
							{
								id: 1,
								collection_c_id: 1,
								languages_id: 'ar-SA',
								text: 'ar-sa',
							},
							{
								id: 2,
								collection_c_id: 1,
								languages_id: 'de-DE',
								text: 'de-de',
							},
						],
					},
				},
				[
					{
						m2o_c: {
							translations: {
								create: [
									{
										text: 'en-us',
										languages_id: {
											code: 'en-US',
										},
										collection_c_id: 1,
									},
								],
								update: [
									{
										text: 'german',
										languages_id: {
											code: 'de-DE',
										},
										id: 2,
									},
								],
								delete: [1],
							},
							id: 1,
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 1,
				status: 'draft',
				m2o_c: {
					id: 1,
					status: 'draft',
					translations: [
						{
							id: 2,
							collection_c_id: 1,
							languages_id: {
								code: 'de-DE',
							},
							text: 'german',
						},
						{
							text: 'en-us',
							languages_id: {
								code: 'en-US',
							},
							collection_c_id: 1,
						},
					],
				},
			});
		});

		test('m2m > translations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 3,
					status: 'draft',
					m2m: [
						{
							id: 2,
							collection_a_id: 3,
							collection_c_id: {
								id: 1,
								status: 'draft',
								translations: [
									{
										id: 1,
										collection_c_id: 1,
										languages_id: 'ar-SA',
										text: 'ar-sa',
									},
									{
										id: 2,
										collection_c_id: 1,
										languages_id: 'de-DE',
										text: 'de-de',
									},
								],
							},
						},
						{
							id: 3,
							collection_a_id: 3,
							collection_c_id: {
								id: 2,
								status: 'draft',
								translations: [],
							},
						},
					],
				},
				[
					{
						m2m: {
							create: [],
							update: [
								{
									collection_c_id: {
										translations: {
											create: [
												{
													text: 'english',
													languages_id: {
														code: 'en-US',
													},
													collection_c_id: 1,
												},
											],
											update: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
													id: 2,
												},
											],
											delete: [1],
										},
										id: 1,
									},
									id: 2,
								},
							],
							delete: [3],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 3,
				status: 'draft',
				m2m: [
					{
						id: 2,
						collection_a_id: 3,
						collection_c_id: {
							translations: [
								{
									id: 2,
									collection_c_id: 1,
									text: 'german',
									languages_id: {
										code: 'de-DE',
									},
								},
								{
									text: 'english',
									languages_id: {
										code: 'en-US',
									},
									collection_c_id: 1,
								},
							],
							id: 1,
						},
					},
				],
			});
		});

		test('m2a > translations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 4,
					status: 'draft',
					m2a: [
						{
							id: 3,
							collection_a_id: 4,
							collection: 'collection_b',
							item: 2,
						},
						{
							id: 4,
							collection_a_id: 4,
							collection: 'collection_c',
							item: {
								id: 1,
								translations: [
									{
										id: 1,
										collection_c_id: 1,
										languages_id: 'ar-SA',
										text: 'ar-sa',
									},
									{
										id: 2,
										collection_c_id: 1,
										languages_id: 'de-DE',
										text: 'de-de',
									},
								],
							},
						},
					],
				},
				[
					{
						m2a: {
							create: [],
							update: [
								{
									collection: 'collection_c',
									item: {
										translations: {
											create: [
												{
													languages_id: {
														code: 'en-US',
													},
													collection_c_id: 1,
													text: 'english',
												},
											],
											update: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
													id: 2,
												},
											],
											delete: [1],
										},
										id: 1,
									},
									id: 4,
								},
							],
							delete: [],
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 4,
				status: 'draft',
				m2a: [
					{
						id: 3,
						collection_a_id: 4,
						collection: 'collection_b',
						item: 2,
					},
					{
						id: 4,
						collection_a_id: 4,
						collection: 'collection_c',
						item: {
							id: 1,
							translations: [
								{
									id: 2,
									collection_c_id: 1,
									languages_id: {
										code: 'de-DE',
									},
									text: 'german',
								},
								{
									languages_id: {
										code: 'en-US',
									},
									collection_c_id: 1,
									text: 'english',
								},
							],
						},
					},
				],
			});
		});

		test('creating nested relations', () => {
			const result = mergeVersionsRecursive(
				{
					id: 2,
					status: 'draft',
					m2m: [],
					m2o_c: null,
				},
				[
					{
						m2m: {
							create: [
								{
									collection_c_id: {
										translations: {
											create: [
												{
													text: 'german',
													languages_id: {
														code: 'de-DE',
													},
												},
												{
													text: 'english',
													languages_id: {
														code: 'en-US',
													},
												},
											],
											update: [],
											delete: [],
										},
									},
								},
							],
							update: [],
							delete: [],
						},
						m2o_c: {
							translations: {
								create: [
									{
										text: 'french',
										languages_id: {
											code: 'fr-FR',
										},
									},
									{
										text: 'english',
										languages_id: {
											code: 'en-US',
										},
									},
								],
								update: [],
								delete: [],
							},
						},
					},
				],
				'collection_a',
				schema,
			);

			expect(result).toMatchObject({
				id: 2,
				status: 'draft',
				m2m: [
					{
						collection_c_id: {
							translations: [
								{
									text: 'german',
									languages_id: {
										code: 'de-DE',
									},
								},
								{
									text: 'english',
									languages_id: {
										code: 'en-US',
									},
								},
							],
						},
					},
				],
				m2o_c: {
					translations: [
						{
							text: 'french',
							languages_id: {
								code: 'fr-FR',
							},
						},
						{
							text: 'english',
							languages_id: {
								code: 'en-US',
							},
						},
					],
				},
			});
		});
	});
});
