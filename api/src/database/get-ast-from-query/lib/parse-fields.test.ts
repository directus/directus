import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { getRelation } from '@directus/utils';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { Client_SQLite3 } from '../../run-ast/lib/apply-query/mock.js';
import { parseFields } from './parse-fields.js';

vi.mock('../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

const fetchAllowedFieldsMock = vi.mocked(fetchAllowedFields);

const accountability = {
	admin: true,
} as Accountability;

const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').dateTime();
	})
	.build();

test('parse fields without any fields', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: [], parentCollection: 'articles', query: {} },
		{ knex: db, schema },
	);

	expect(result).toEqual([]);
});

test('parse fields with id and title', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'title'], parentCollection: 'articles', query: {} },
		{ knex: db, schema },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			alias: false,
			fieldKey: 'title',
			name: 'title',
			type: 'field',
			whenCase: [],
		},
	]);
});

const schemaRelational = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').dateTime();
		c.field('author').m2o('users');
		c.field('links').o2m('links', 'article_id');
		c.field('tags').m2m('tags');
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

test('parse fields with m2o relation', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'author.name'], parentCollection: 'articles', query: {} },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'name',
					name: 'name',
					type: 'field',
					whenCase: [],
				},
			],
			fieldKey: 'author',
			name: 'users',
			parentKey: 'id',
			query: {},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'articles', 'author'),
			type: 'm2o',
			whenCase: [],
		},
	]);
});

test('parse fields with o2m relation', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'links.id'], parentCollection: 'articles', query: {} },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'id',
					name: 'id',
					type: 'field',
					whenCase: [],
				},
			],
			fieldKey: 'links',
			name: 'links',
			parentKey: 'id',
			query: {
				sort: ['id'],
			},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'articles', 'links'),
			type: 'o2m',
			whenCase: [],
		},
	]);
});

test('parse fields with m2m relation', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'tags.tags_id.id'], parentCollection: 'articles', query: {} },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					cases: [],
					children: [
						{
							alias: false,
							fieldKey: 'id',
							name: 'id',
							type: 'field',
							whenCase: [],
						},
					],
					fieldKey: 'tags_id',
					name: 'tags',
					parentKey: 'id',
					query: {},
					relatedKey: 'id',
					relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'tags_id'),
					type: 'm2o',
					whenCase: [],
				},
			],
			fieldKey: 'tags',
			name: 'articles_tags_junction',
			parentKey: 'id',
			query: {
				sort: ['id'],
			},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'articles', 'tags'),
			type: 'o2m',
			whenCase: [],
		},
	]);
});

test('parse fields with *.*.*', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['*.*.*'], parentCollection: 'articles', query: {} },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			alias: false,
			fieldKey: 'title',
			name: 'title',
			type: 'field',
			whenCase: [],
		},
		{
			alias: false,
			fieldKey: 'date',
			name: 'date',
			type: 'field',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'id',
					name: 'id',
					type: 'field',
					whenCase: [],
				},
				{
					alias: false,
					fieldKey: 'name',
					name: 'name',
					type: 'field',
					whenCase: [],
				},
			],
			fieldKey: 'author',
			name: 'users',
			parentKey: 'id',
			query: {},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'articles', 'author'),
			type: 'm2o',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'id',
					name: 'id',
					type: 'field',
					whenCase: [],
				},
				{
					cases: [],
					children: [
						{
							alias: false,
							fieldKey: 'id',
							name: 'id',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'title',
							name: 'title',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'date',
							name: 'date',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'author',
							name: 'author',
							type: 'field',
							whenCase: [],
						},
						{
							cases: [],
							children: [],
							fieldKey: 'links',
							name: 'links',
							parentKey: 'id',
							query: {
								sort: ['id'],
							},
							relatedKey: 'id',
							relation: getRelation(schemaRelational.relations, 'links', 'article_id'),
							type: 'o2m',
							whenCase: [],
						},
						{
							cases: [],
							children: [],
							fieldKey: 'tags',
							name: 'articles_tags_junction',
							parentKey: 'id',
							query: {
								sort: ['id'],
							},
							relatedKey: 'id',
							relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'articles_id'),
							type: 'o2m',
							whenCase: [],
						},
					],
					fieldKey: 'article_id',
					name: 'articles',
					parentKey: 'id',
					query: {},
					relatedKey: 'id',
					relation: getRelation(schemaRelational.relations, 'links', 'article_id'),
					type: 'm2o',
					whenCase: [],
				},
			],
			fieldKey: 'links',
			name: 'links',
			parentKey: 'id',
			query: {
				sort: ['id'],
			},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'links', 'article_id'),
			type: 'o2m',
			whenCase: [],
		},
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'id',
					name: 'id',
					type: 'field',
					whenCase: [],
				},
				{
					cases: [],
					children: [
						{
							alias: false,
							fieldKey: 'id',
							name: 'id',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'title',
							name: 'title',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'date',
							name: 'date',
							type: 'field',
							whenCase: [],
						},
						{
							alias: false,
							fieldKey: 'author',
							name: 'author',
							type: 'field',
							whenCase: [],
						},
						{
							cases: [],
							children: [],
							fieldKey: 'links',
							name: 'links',
							parentKey: 'id',
							query: {
								sort: ['id'],
							},
							relatedKey: 'id',
							relation: getRelation(schemaRelational.relations, 'links', 'article_id'),
							type: 'o2m',
							whenCase: [],
						},
						{
							cases: [],
							children: [],
							fieldKey: 'tags',
							name: 'articles_tags_junction',
							parentKey: 'id',
							query: {
								sort: ['id'],
							},
							relatedKey: 'id',
							relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'articles_id'),
							type: 'o2m',
							whenCase: [],
						},
					],
					fieldKey: 'articles_id',
					name: 'articles',
					parentKey: 'id',
					query: {},
					relatedKey: 'id',
					relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'articles_id'),
					type: 'm2o',
					whenCase: [],
				},
				{
					cases: [],
					children: [
						{
							alias: false,
							fieldKey: 'id',
							name: 'id',
							type: 'field',
							whenCase: [],
						},
					],
					fieldKey: 'tags_id',
					name: 'tags',
					parentKey: 'id',
					query: {},
					relatedKey: 'id',
					relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'tags_id'),
					type: 'm2o',
					whenCase: [],
				},
			],
			fieldKey: 'tags',
			name: 'articles_tags_junction',
			parentKey: 'id',
			query: {
				sort: ['id'],
			},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'articles_tags_junction', 'articles_id'),
			type: 'o2m',
			whenCase: [],
		},
	]);
});

test('parse fields with links.*.* and backlinks disabled', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['links.*.*'], parentCollection: 'articles', query: { backlink: false } },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual([
		{
			cases: [],
			children: [
				{
					alias: false,
					fieldKey: 'id',
					name: 'id',
					type: 'field',
					whenCase: [],
				},
				{
					alias: false,
					fieldKey: 'article_id',
					name: 'article_id',
					type: 'field',
					whenCase: [],
				},
			],
			fieldKey: 'links',
			name: 'links',
			parentKey: 'id',
			query: {
				sort: ['id'],
			},
			relatedKey: 'id',
			relation: getRelation(schemaRelational.relations, 'links', 'article_id'),
			type: 'o2m',
			whenCase: [],
		},
	]);
});

const schemaWithJson = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').dateTime();
		c.field('metadata').json();
	})
	.build();

test('parse fields with year function', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'year(date)'], parentCollection: 'articles', query: {} },
		{ knex: db, schema },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			alias: false,
			fieldKey: 'year(date)',
			name: 'year(date)',
			type: 'field',
			whenCase: [],
		},
	]);
});

test('parse fields with json function containing dotted path', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{ accountability, fields: ['id', 'json(metadata:color)'], parentCollection: 'articles', query: {} },
		{ knex: db, schema: schemaWithJson },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			type: 'functionField',
			fieldKey: 'json(metadata:color)',
			name: 'json(metadata:color)',
			query: {},
			relatedCollection: 'articles',
			whenCase: [],
			cases: [],
		},
	]);
});

test('parse fields with json function containing nested path', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await parseFields(
		{
			accountability,
			fields: ['id', 'json(metadata:user.name)', 'title'],
			parentCollection: 'articles',
			query: {},
		},
		{ knex: db, schema: schemaWithJson },
	);

	expect(result).toEqual([
		{
			alias: false,
			fieldKey: 'id',
			name: 'id',
			type: 'field',
			whenCase: [],
		},
		{
			type: 'functionField',
			fieldKey: 'json(metadata:user.name)',
			name: 'json(metadata:user.name)',
			query: {},
			relatedCollection: 'articles',
			whenCase: [],
			cases: [],
		},
		{
			alias: false,
			fieldKey: 'title',
			name: 'title',
			type: 'field',
			whenCase: [],
		},
	]);
});

test('parse fields distinguishes json function from relational fields', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	// Create schema with both relational fields and json field
	const schemaWithBoth = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('author').m2o('users');
			c.field('metadata').json();
		})
		.collection('users', (c) => {
			c.field('id').id();
			c.field('name').string();
		})
		.build();

	const result = await parseFields(
		{
			accountability,
			fields: ['id', 'author.name', 'json(metadata:color)'],
			parentCollection: 'articles',
			query: {},
		},
		{ knex: db, schema: schemaWithBoth },
	);

	// author.name should be a relational field (m2o node)
	// json(metadata:color) should be a functionField node
	expect(result).toHaveLength(3);

	expect(result[0]).toEqual({
		alias: false,
		fieldKey: 'id',
		name: 'id',
		type: 'field',
		whenCase: [],
	});

	// json function is processed first since it's detected before relational fields
	expect(result[1]).toEqual({
		type: 'functionField',
		fieldKey: 'json(metadata:color)',
		name: 'json(metadata:color)',
		query: {},
		relatedCollection: 'articles',
		whenCase: [],
		cases: [],
	});

	expect(result[2]?.type).toBe('m2o');
});
