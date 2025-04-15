import type { Permission, SchemaOverview } from '@directus/types';
import { Knex } from 'knex';
import { expect, test, vi } from 'vitest';
import { applySearch } from './search.js';

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
				string: {
					field: 'string',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'string',
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

const permissions = [
	{
		collection: 'test',
		action: 'read',
		fields: ['text', 'float', 'integer', 'id'],
		permissions: {
			text: {},
		},
	},
] as unknown as Permission[];

function mockDatabase(dbClient: string = 'Client_SQLite3') {
	const whereQueries = {
		whereRaw: vi.fn(() => self),
		where: vi.fn(() => self),
	};

	const self: Record<string, any> = {
		client: {
			constructor: {
				name: dbClient,
			},
		},
		andWhere: vi.fn(() => self),
		orWhere: vi.fn(() => self),
		orWhereRaw: vi.fn(() => self),
		and: whereQueries,
		or: whereQueries,
	};

	return self;
}

test.each(['0x56071c902718e681e274DB0AaC9B4Ed2d027924d', '0b11111', '0.42e3', 'Infinity', '42.000'])(
	'Prevent %s from being cast to number',
	async (number) => {
		const db = mockDatabase();
		const queryBuilder = db as any;

		db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
			callback(queryBuilder);
			return queryBuilder;
		});

		queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
			callback(queryBuilder);
			return queryBuilder;
		});

		applySearch(db as any, FAKE_SCHEMA, queryBuilder, number, 'test', {}, permissions);

		expect(db['andWhere']).toBeCalledTimes(1);
		expect(queryBuilder['orWhere']).toBeCalledTimes(1);
		expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
		expect(queryBuilder['and']['whereRaw']).toBeCalledTimes(1);

		expect(queryBuilder['and']['whereRaw']).toBeCalledWith('LOWER(??) LIKE ?', [
			'test.text',
			`%${number.toLowerCase()}%`,
		]);
	},
);

test.each(['1234', '-128', '12.34'])('Casting number %s', async (number) => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, number, 'test', {}, permissions);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(3);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['and']['whereRaw']).toBeCalledTimes(1);

	expect(queryBuilder['and']['whereRaw']).toBeCalledWith('LOWER(??) LIKE ?', [
		'test.text',
		`%${number.toLowerCase()}%`,
	]);
});

test('Query is falsy if no other clause is added', async () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	const schemaWithStringFieldRemoved = JSON.parse(JSON.stringify(FAKE_SCHEMA));

	delete schemaWithStringFieldRemoved.collections.test.fields.text;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, schemaWithStringFieldRemoved, queryBuilder, 'searchstring', 'test', {}, permissions);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(0);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(1);
	expect(queryBuilder['orWhereRaw']).toBeCalledWith('1 = 0');
});

test('Exclude non uuid searchable field(s) when searchQuery has valid uuid value', () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, '4b9adc65-4ad8-4242-9144-fbfc58400d74', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['id', 'text'],
			permissions: null,
		} as unknown as Permission,
	]);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(2);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['or']['whereRaw']).toBeCalledTimes(1);
	expect(queryBuilder['or']['where']).toBeCalledTimes(1);
	expect(queryBuilder['or']['where']).toBeCalledWith({ 'test.id': '4b9adc65-4ad8-4242-9144-fbfc58400d74' });
});

test('Remove forbidden field(s) from search', () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, 'directus', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['string'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['and']['whereRaw']).toBeCalledTimes(1);
	expect(queryBuilder['and']['whereRaw']).toBeCalledWith('LOWER(??) LIKE ?', ['test.string', `%directus%`]);
});

test('Add all fields for * field rule', () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*'],
			permissions: null,
		} as unknown as Permission,
	]);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(0);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['or']['whereRaw']).toBeCalledTimes(2);
	expect(queryBuilder['or']['where']).toBeCalledTimes(2);
});

test('Add all fields when * is present in field rule with permission rule present', () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*', 'text'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(0);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['or']['whereRaw']).toBeCalledTimes(2);
	expect(queryBuilder['or']['where']).toBeCalledTimes(2);
});

test('All field(s) are searched for admin', () => {
	const db = mockDatabase();
	const queryBuilder = db as any;

	db['andWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	queryBuilder['orWhere'].mockImplementation((callback: (queryBuilder: Knex.QueryBuilder) => void) => {
		callback(queryBuilder);
		return queryBuilder;
	});

	applySearch(db as any, FAKE_SCHEMA, queryBuilder, '1', 'test', {}, []);

	expect(db['andWhere']).toBeCalledTimes(1);
	expect(queryBuilder['orWhere']).toBeCalledTimes(0);
	expect(queryBuilder['orWhereRaw']).toBeCalledTimes(0);
	expect(queryBuilder['and']['whereRaw']).toBeCalledTimes(2);
	expect(queryBuilder['or']['whereRaw']).toBeCalledTimes(2);
});
