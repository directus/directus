import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import { PayloadService } from './index.js';
import { SchemaBuilder } from '@directus/schema-builder';

vi.mock('../../src/database/index', () => ({
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / PayloadService', () => {
		describe('transformers', () => {
			let service: PayloadService;
			let helpers: Helpers;

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema: { collections: {}, relations: [] },
				});

				helpers = getHelpers(db);
			});

			describe('csv', () => {
				test('Returns undefined for illegal values', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 123,
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe(undefined);
				});

				test('Returns [] for empty strings', async () => {
					const result = await service.transformers['cast-csv']!({
						value: '',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toMatchObject([]);
				});

				test('Returns array values as is', async () => {
					const result = await service.transformers['cast-csv']!({
						value: ['test', 'directus'],
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toEqual(['test', 'directus']);
				});

				test('Splits the CSV string', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 'test,directus',
						action: 'read',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toMatchObject(['test', 'directus']);
				});

				test('Saves array values as joined string', async () => {
					const result = await service.transformers['cast-csv']!({
						value: ['test', 'directus'],
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe('test,directus');
				});

				test('Saves string values as is', async () => {
					const result = await service.transformers['cast-csv']!({
						value: 'test,directus',
						action: 'create',
						payload: {},
						accountability: { role: null },
						specials: [],
						helpers,
					});

					expect(result).toBe('test,directus');
				});
			});
		});

		describe('processDates', () => {
			let service: PayloadService;

			const schema = new SchemaBuilder()
				.collection('test', (c) => {
					c.field('id').id();
					c.field('date_field').date();
					c.field('datetime_field').dateTime();
					c.field('timestamp_field').timestamp();
				})
				.build();

			const fieldEntries = Object.entries(schema.collections['test']!.fields);

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema,
				});
			});

			describe('processes dates', () => {
				test('with zero values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								date_field: '0000-00-00',
								datetime_field: '0000-00-00 00:00:00',
								timestamp_field: '0000-00-00 00:00:00.000',
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							date_field: null,
							datetime_field: null,
							timestamp_field: null,
						},
					]);
				});

				test('with typical values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								date_field: '2022-01-10',
								datetime_field: '2021-09-31 12:34:56',
								timestamp_field: '1980-12-08 00:11:22.333',
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							date_field: '2022-01-10',
							datetime_field: '2021-10-01T12:34:56',
							timestamp_field: new Date('1980-12-08 00:11:22.333').toISOString(),
						},
					]);
				});

				test('with date object values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								date_field: new Date(1666777777000),
								datetime_field: new Date(1666666666000),
								timestamp_field: new Date(1666555444333),
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							date_field: toLocalISOString(new Date(1666777777000)).slice(0, 10),
							datetime_field: toLocalISOString(new Date(1666666666000)),
							timestamp_field: new Date(1666555444333).toISOString(),
						},
					]);
				});

				test('with alias and typical values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								'date-alias': '2022-01-10',
								'datetime-alias': '2021-09-31 12:34:56',
								'timestamp-alias': '1980-12-08 00:11:22.333',
							},
						],
						'read',
						{ 'date-alias': 'date_field', 'datetime-alias': 'datetime_field', 'timestamp-alias': 'timestamp_field' },
					);

					expect(result).toMatchObject([
						{
							'date-alias': '2022-01-10',
							'datetime-alias': '2021-10-01T12:34:56',
							'timestamp-alias': new Date('1980-12-08 00:11:22.333').toISOString(),
						},
					]);
				});

				test('with alias and object values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								'date-alias': new Date(1666777777000),
								'datetime-alias': new Date(1666666666000),
								'timestamp-alias': new Date(1666555444333),
							},
						],
						'read',
						{ 'date-alias': 'date_field', 'datetime-alias': 'datetime_field', 'timestamp-alias': 'timestamp_field' },
					);

					expect(result).toMatchObject([
						{
							'date-alias': toLocalISOString(new Date(1666777777000)).slice(0, 10),
							'datetime-alias': toLocalISOString(new Date(1666666666000)),
							'timestamp-alias': new Date(1666555444333).toISOString(),
						},
					]);
				});
			});
		});

		describe('processValues', () => {
			let service: PayloadService;

			const REDACT_STR = '**********';

			const schema = new SchemaBuilder()
				.collection('test', (c) => {
					c.field('id').id();
					c.field('string').string();

					c.field('hidden')
						.hash()
						.options({
							special: ['hash', 'conceal'],
						});
				})
				.build();

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema,
				});
			});

			test('processing special fields', async () => {
				const result = await service.processValues('read', {
					string: 'not-redacted',
					hidden: 'secret',
				});

				expect(result).toMatchObject({ string: 'not-redacted', hidden: REDACT_STR });
			});

			test('processing aliassed special fields', async () => {
				const result = await service.processValues(
					'read',
					{
						other_string: 'not-redacted',
						other_hidden: 'secret',
					},
					{ other_string: 'string', other_hidden: 'hidden' },
				);

				expect(result).toMatchObject({ other_string: 'not-redacted', other_hidden: REDACT_STR });
			});
		});
	});
});

function toLocalISOString(date: Date) {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
