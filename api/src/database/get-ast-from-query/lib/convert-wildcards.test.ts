import { convertWildcards } from './convert-wildcards.js';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { Client_SQLite3 } from '../../run-ast/lib/apply-query/mock.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { getRelation } from '@directus/utils';
import knex from 'knex';
import { expect, test, vi } from 'vitest';

vi.mock('../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js');

const fetchAllowedFieldsMock = vi.mocked(fetchAllowedFields);

const accountability = {
	admin: false,
} as Accountability;

const db = vi.mocked(knex.default({ client: Client_SQLite3 }));

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').dateTime();
	})
	.build();

test('converting nothing without any permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await convertWildcards(
		{ collection: 'articles', fields: [], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual([]);
});

test('converting * without any permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual([]);
});

test('converting * without any permissions and alias is null', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce([]);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: null, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual([]);
});

test('converting * with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['id', 'title', 'date']);
});

test('converting * with just id permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['id']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['id']);
});

test('converting title with any permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['title']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['title'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['title']);
});

test('converting invalid field with any permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['invalid'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['invalid']);
});

test('converting invalid field with id, title permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['id', 'title']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['invalid'], alias: {}, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['invalid']);
});

test('converting * with admin permissions', async () => {
	const result = await convertWildcards(
		{
			collection: 'articles',
			fields: ['*'],
			alias: {},
			accountability: { admin: true } as Accountability,
			backlink: true,
		},
		{ knex: db, schema },
	);

	expect(result).toEqual(['id', 'title', 'date']);
});

test('converting title with admin permissions', async () => {
	const result = await convertWildcards(
		{
			collection: 'articles',
			fields: ['title'],
			alias: {},
			accountability: { admin: true } as Accountability,
			backlink: true,
		},
		{ knex: db, schema },
	);

	expect(result).toEqual(['title']);
});

test('converting alias field with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: { alias: 'id' }, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['id', 'title', 'date', 'alias']);
});

test('converting invalid alias field with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*'], alias: { alias: 'invalid' }, accountability, backlink: true },
		{ knex: db, schema },
	);

	expect(result).toEqual(['id', 'title', 'date']);
});

const schemaRelational = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('date').dateTime();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

test('converting *.* with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*'], alias: {}, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*', 'tags.*', 'id', 'title', 'date']);
});

test('converting *.*.* with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*.*'], alias: {}, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*.*', 'tags.*.*', 'id', 'title', 'date']);
});

test('converting *.* and alias with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*'], alias: { alias: 'title' }, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*', 'tags.*', 'id', 'title', 'date', 'alias']);
});

test('converting alias as year(date) with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*'], alias: { alias: 'year(date)' }, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*', 'tags.*', 'id', 'title', 'date', 'alias']);
});

test('converting year(alias) as date with * permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*'], alias: { 'year(alias)': 'date' }, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*', 'tags.*', 'id', 'title', 'date', 'year(alias)']);
});

test('converting *.* and alias with id, title and author permissions', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['id', 'title', 'author']);

	const result = await convertWildcards(
		{ collection: 'articles', fields: ['*.*'], alias: { alias: 'title' }, accountability, backlink: true },
		{ knex: db, schema: schemaRelational },
	);

	expect(result).toEqual(['author.*', 'id', 'title', 'alias']);
});

test('backlink set to true', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles_tags_junction', fields: ['*.*'], alias: {}, accountability, backlink: true },
		{
			knex: db,
			schema: schemaRelational,
			parentRelation: getRelation(schemaRelational.relations, 'articles', 'tags')!,
		},
	);

	expect(result).toEqual(['articles_id.*', 'tags_id.*', 'id']);
});

test('backlink set to false', async () => {
	fetchAllowedFieldsMock.mockResolvedValueOnce(['*']);

	const result = await convertWildcards(
		{ collection: 'articles_tags_junction', fields: ['*.*'], alias: {}, accountability, backlink: false },
		{
			knex: db,
			schema: schemaRelational,
			parentRelation: getRelation(schemaRelational.relations, 'articles', 'tags')!,
		},
	);

	expect(result).toEqual(['tags_id.*', 'id', 'articles_id']);
});
