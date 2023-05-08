import { expect, vi, test, describe } from 'vitest';
import { applySearch } from './apply-query.js';
import type { SchemaOverview } from '@directus/types';

function mockDatabase() {
	const self: Record<string, any> = {
		andWhere: vi.fn(() => self),
		orWhere: vi.fn(() => self),
		orWhereRaw: vi.fn(() => self),
	};

	return self;
}

describe('applySearch', () => {
	const FAKE_SCHEMA: SchemaOverview = {
		collections: {
			test: {
				collection: 'test',
				primary: 'id',
				singleton: false,
				sortField: null,
				note: null,
				accountability: null,
				fields: {
					text: {
						field: 'text',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'text',
						dbType: null,
						precision: null,
						scale: null,
						special: [],
						note: null,
						validation: null,
						alias: false,
					},
					float: {
						field: 'float',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'float',
						dbType: null,
						precision: null,
						scale: null,
						special: [],
						note: null,
						validation: null,
						alias: false,
					},
					integer: {
						field: 'integer',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'integer',
						dbType: null,
						precision: null,
						scale: null,
						special: [],
						note: null,
						validation: null,
						alias: false,
					},
					id: {
						field: 'id',
						defaultValue: null,
						nullable: false,
						generated: false,
						type: 'uuid',
						dbType: null,
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

	test.each(['0x56071c902718e681e274DB0AaC9B4Ed2d027924d', '0b11111', '0.42e3', 'Infinity', '42.000'])(
		'Prevent %s from being cast to number',
		async (number) => {
			const db = mockDatabase();

			db['andWhere'].mockImplementation((callback: () => void) => {
				// detonate the andWhere function
				callback.call(db);
				return db;
			});

			await applySearch(FAKE_SCHEMA, db as any, number, 'test');

			expect(db['andWhere']).toBeCalledTimes(1);
			expect(db['orWhere']).toBeCalledTimes(0);
			expect(db['orWhereRaw']).toBeCalledTimes(1);
		}
	);

	test.each(['1234', '-128', '12.34'])('Casting number %s', async (number) => {
		const db = mockDatabase();

		db['andWhere'].mockImplementation((callback: () => void) => {
			// detonate the andWhere function
			callback.call(db);
			return db;
		});

		await applySearch(FAKE_SCHEMA, db as any, number, 'test');

		expect(db['andWhere']).toBeCalledTimes(1);
		expect(db['orWhere']).toBeCalledTimes(2);
		expect(db['orWhereRaw']).toBeCalledTimes(1);
	});
});
