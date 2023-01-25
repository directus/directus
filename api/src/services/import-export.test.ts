import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ImportService } from '.';
import { describe, beforeAll, afterEach, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { Readable } from 'stream';
import emitter from '../emitter';
import { parse } from 'json2csv';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = getTracker();
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
});
