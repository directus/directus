import { parse } from 'json2csv';
import knex, { Knex } from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { EOL } from 'node:os';
import { Readable } from 'stream';
import { afterEach, beforeAll, beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { ExportService, ImportService } from '.';
import { ServiceUnavailableException } from '..';
import emitter from '../emitter';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / ImportService', () => {
		let service: ImportService;
		let insertedId = 1;
		const collection = 'test_coll';

		beforeEach(() => {
			service = new ImportService({
				knex: db,
				schema: {
					collections: {
						[collection]: {
							collection,
							primary: 'id',
							singleton: false,
							sortField: null,
							note: null,
							accountability: null,
							fields: {
								id: {
									field: 'id',
									defaultValue: null,
									nullable: false,
									generated: true,
									type: 'integer',
									dbType: 'integer',
									precision: null,
									scale: null,
									special: [],
									note: null,
									validation: null,
									alias: false,
								},
								name: {
									field: 'name',
									defaultValue: null,
									nullable: true,
									generated: false,
									type: 'string',
									dbType: 'string',
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

			insertedId = 1;
		});

		describe('importJSON', () => {
			it('Emits action for correct number of times', async () => {
				const emitActionSpy = vi.spyOn(emitter, 'emitAction');
				const data = [{ name: 'aaa' }, { name: 'bbb' }, { name: 'ccc' }];
				const stream = new Readable({
					read() {
						this.push(JSON.stringify(data));
						this.push(null);
					},
				});
				tracker.on.insert(collection).response(() => [insertedId++]);

				await service.importJSON(collection, stream);

				expect(emitActionSpy).toBeCalledTimes(insertedId - 1);
			});
		});

		describe('importCSV', () => {
			it('Emits action for correct number of times', async () => {
				const emitActionSpy = vi.spyOn(emitter, 'emitAction');
				const data = [{ name: 'ddd' }, { name: 'eee' }, { name: 'fff' }];
				const stream = new Readable({
					read() {
						this.push(parse(data));
						this.push(null);
					},
				});
				tracker.on.insert(collection).response(() => [insertedId++]);

				await service.importCSV(collection, stream);

				expect(emitActionSpy).toBeCalledTimes(insertedId - 1);
			});
		});
	});

	describe('Services / ExportService', () => {
		describe('transform', () => {
			it('should return json string with header and footer', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(service.transform(input, 'json')).toBe(`[\n\t{\n\t\t"key": "value"\n\t}\n]`);
			});

			it('should return xml string with header and footer', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(service.transform(input, 'xml')).toBe(
					`<?xml version='1.0'?>\n<data>\n    <data>\n        <key>value</key>\n    </data>\n</data>`
				);
			});

			it('should return csv string with header', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(service.transform(input, 'csv')).toBe(`"key"${EOL}"value"`);
			});

			it('should return csv string without header', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(service.transform(input, 'csv', { includeHeader: false })).toBe('\n"value"');
			});

			it('should return yaml string', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(service.transform(input, 'yaml')).toBe('- key: value\n');
			});

			it('should throw ServiceUnavailableException error when using a non-existent export type', () => {
				const input = [{ key: 'value' }];

				const service = new ExportService({ knex: db, schema: { collections: {}, relations: [] } });

				expect(() => service.transform(input, 'invalid-format' as any)).toThrowError(ServiceUnavailableException);
			});
		});
	});
});
