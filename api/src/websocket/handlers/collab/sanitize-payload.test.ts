import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { sanitizePayload } from './sanitize-payload.js';
import { ItemsService } from '../../../services/index.js';

vi.mock('../../../permissions/lib/fetch-policies.js');
vi.mock('../../../permissions/lib/fetch-permissions.js');
vi.mock('../../../services/index.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('secret').hash();
		c.field('tags').m2m('tags');
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
		c.field('secret').hash();
	})
	.build();

vi.mocked(ItemsService).mockReturnValue({
	readOne: () => Promise.resolve({}),
} as any);

const accountability = { user: 'test-user', roles: ['test-role'] } as Accountability;

const db = vi.mocked(knex.default({ client: MockClient }));

test('sanitize with no perms', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 1,
			title: 'Hello World',
			secret: 'top secret',
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({});
});

test('sanitize with * read perms', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([
		{
			action: 'read',
			collection: 'articles',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
	]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 1,
			title: 'Hello World',
			secret: 'top secret',
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({
		id: 1,
		title: 'Hello World',
	});
});

test('sanitize with "title" read perms', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([
		{
			action: 'read',
			collection: 'articles',
			fields: ['title'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
	]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 1,
			title: 'Hello World',
			secret: 'top secret',
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({
		title: 'Hello World',
	});
});

test('sanitize on m2m without perms', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([
		{
			action: 'read',
			collection: 'articles',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
	]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 1,
			title: 'Hello World',
			tags: [{ tag_id: 1 }],
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({
		id: 1,
		title: 'Hello World',
	});
});

test('sanitize on m2m with "*,tags.tags_id.*" read perms', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([
		{
			action: 'read',
			collection: 'articles',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'articles_tags_junction',
			fields: ['tags_id'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'tags',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
	]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 1,
			title: 'Hello World',
			tags: [
				{
					articles_id: 1,
					tags_id: {
						id: 1,
						tag: 'news',
						secret: 'top secret',
					},
				},
			],
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({
		id: 1,
		title: 'Hello World',
		tags: [
			{
				tags_id: {
					id: 1,
					tag: 'news',
				},
			},
		],
	});
});

test('sanitize on m2m with create,update,delete syntax', async () => {
	vi.mocked(fetchPermissions).mockResolvedValueOnce([
		{
			action: 'read',
			collection: 'articles',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'articles_tags_junction',
			fields: ['*'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
		{
			action: 'read',
			collection: 'tags',
			fields: ['tag'],
			policy: null,
			permissions: null,
			presets: [],
			validation: null,
		},
	]);

	const result = await sanitizePayload(
		'articles',
		{
			id: 10,
			title: 'Hello World',
			tags: {
				create: [
					{
						tags_id: {
							id: 11,
							tag: 'news',
						},
					},
				],
				update: [
					{
						tags_id: {
							id: 12,
							tag: 'updates',
						},
					},
				],
				delete: [13],
			},
		},
		{ schema, accountability, knex: db },
	);

	expect(result).toEqual({
		id: 10,
		title: 'Hello World',
		tags: {
			create: [
				{
					tags_id: {
						tag: 'news',
					},
				},
			],
			update: [
				{
					tags_id: {
						tag: 'updates',
					},
				},
			],
			delete: [13],
		},
	});
});
