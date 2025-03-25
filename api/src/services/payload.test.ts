import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import { PayloadService } from './index.js';
import type { SchemaOverview } from '@directus/types';

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

			const dateFieldId = 'date_field';
			const dateTimeFieldId = 'datetime_field';
			const timestampFieldId = 'timestamp_field';

			const schema: SchemaOverview = {
				collections: {
					test: {
						collection: 'test',
						primary: 'id',
						singleton: false,
						sortField: null,
						note: null,
						accountability: null,
						fields: {
							[dateFieldId]: {
								field: dateFieldId,
								defaultValue: null,
								nullable: true,
								generated: false,
								type: 'date',
								dbType: 'date',
								precision: null,
								scale: null,
								special: [],
								note: null,
								validation: null,
								alias: false,
							},
							[dateTimeFieldId]: {
								field: dateTimeFieldId,
								defaultValue: null,
								nullable: true,
								generated: false,
								type: 'dateTime',
								dbType: 'datetime',
								precision: null,
								scale: null,
								special: [],
								note: null,
								validation: null,
								alias: false,
							},
							[timestampFieldId]: {
								field: timestampFieldId,
								defaultValue: null,
								nullable: true,
								generated: false,
								type: 'timestamp',
								dbType: 'timestamp',
								precision: null,
								scale: null,
								special: [],
								note: null,
								validation: null,
								alias: false,
							},
						},
					},
				},
				relations: [],
			};

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
								[dateFieldId]: '0000-00-00',
								[dateTimeFieldId]: '0000-00-00 00:00:00',
								[timestampFieldId]: '0000-00-00 00:00:00.000',
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							[dateFieldId]: null,
							[dateTimeFieldId]: null,
							[timestampFieldId]: null,
						},
					]);
				});

				test('with typical values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								[dateFieldId]: '2022-01-10',
								[dateTimeFieldId]: '2021-09-31 12:34:56',
								[timestampFieldId]: '1980-12-08 00:11:22.333',
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							[dateFieldId]: '2022-01-10',
							[dateTimeFieldId]: '2021-10-01T12:34:56',
							[timestampFieldId]: new Date('1980-12-08 00:11:22.333').toISOString(),
						},
					]);
				});

				test('with date object values', () => {
					const result = service.processDates(
						fieldEntries,
						[
							{
								[dateFieldId]: new Date(1666777777000),
								[dateTimeFieldId]: new Date(1666666666000),
								[timestampFieldId]: new Date(1666555444333),
							},
						],
						'read',
					);

					expect(result).toMatchObject([
						{
							[dateFieldId]: toLocalISOString(new Date(1666777777000)).slice(0, 10),
							[dateTimeFieldId]: toLocalISOString(new Date(1666666666000)),
							[timestampFieldId]: new Date(1666555444333).toISOString(),
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
						{ 'date-alias': dateFieldId, 'datetime-alias': dateTimeFieldId, 'timestamp-alias': timestampFieldId },
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
						{ 'date-alias': dateFieldId, 'datetime-alias': dateTimeFieldId, 'timestamp-alias': timestampFieldId },
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

			const concealedField = 'hidden';
			const stringField = 'string';
			const REDACT_STR = '**********';

			beforeEach(() => {
				service = new PayloadService('test', {
					knex: db,
					schema: {
						collections: {
							test: {
								collection: 'test',
								primary: 'id',
								singleton: false,
								sortField: null,
								note: null,
								accountability: null,
								fields: {
									[concealedField]: {
										field: concealedField,
										defaultValue: null,
										nullable: true,
										generated: false,
										type: 'hash',
										dbType: 'nvarchar',
										precision: null,
										scale: null,
										special: ['hash', 'conceal'],
										note: null,
										validation: null,
										alias: false,
									},
									[stringField]: {
										field: stringField,
										defaultValue: null,
										nullable: true,
										generated: false,
										type: 'string',
										dbType: 'nvarchar',
										precision: null,
										scale: null,
										special: [],
										note: null,
										validation: null,
										alias: false,
									},
								},
							},
						},
						relations: [],
					},
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
