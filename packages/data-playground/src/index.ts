import DataDriverPostgres from '../../data-driver-postgres/src/index.js';
import type { AbstractQuery } from '../../data/src/index.js';
import { DataEngine } from '../../data/src/index.js';

const query: AbstractQuery = {
	store: 'postgres',
	collection: 'articles',
	fields: [
		{
			type: 'primitive',
			field: 'id',
			alias: 'id',
		},
		{
			type: 'primitive',
			field: 'title',
			alias: 'title',
		},
		{
			type: 'nested-single-one',
			fields: [
				{
					type: 'primitive',
					field: 'name',
					alias: 'authorName',
				},
			],
			alias: 'author',
			nesting: {
				type: 'relational-many',
				local: {
					fields: ['author'],
				},
				foreign: {
					store: 'postgres',
					collection: 'authors',
					fields: ['id'],
				},
			},
		},
	],
	modifiers: {
		sort: [
			{
				type: 'sort',
				direction: 'ascending',
				target: {
					type: 'nested-one-target',
					field: {
						type: 'primitive',
						field: 'name',
					},
					nesting: {
						type: 'relational-many',
						local: {
							fields: ['author'],
						},
						foreign: {
							store: 'postgres',
							collection: 'authors',
							fields: ['id'],
						},
					},
				},
			},
		],
	},
};

const endWithConditionQuery: AbstractQuery = {
	store: 'postgres',
	collection: 'articles',
	fields: [
		{
			type: 'primitive',
			field: 'id',
			alias: 'id',
		},
		{
			type: 'primitive',
			field: 'title',
			alias: 'title',
		},
	],
	modifiers: {
		filter: {
			type: 'condition',
			condition: {
				type: 'condition-string',
				target: {
					type: 'primitive',
					field: 'status',
				},
				operation: 'ends_with',
				compareTo: 't',
			},
		},
	},
};

const o2mQuery: AbstractQuery = {
	store: 'postgres',
	collection: 'film',
	fields: [
		{
			type: 'primitive',
			field: 'title',
			alias: 'title',
		},
		{
			type: 'primitive',
			field: 'film_id',
			alias: 'film_id',
		},
		{
			type: 'nested-single-many',
			fields: [
				{
					type: 'primitive',
					field: 'actor_id',
					alias: 'actor_id',
				},
				{
					type: 'primitive',
					field: 'film_id',
					alias: 'film_id',
				},
				{
					type: 'primitive',
					field: 'last_update',
					alias: 'last_update',
				},
				{
					type: 'nested-single-one',
					fields: [
						{
							type: 'primitive',
							field: 'first_name',
							alias: 'first_name',
						},
						{
							type: 'primitive',
							field: 'last_name',
							alias: 'last_name',
						},
					],
					alias: 'actor',
					nesting: {
						type: 'relational-many',
						local: { fields: ['actor_id'] },
						foreign: {
							store: 'postgres',
							collection: 'actor',
							fields: ['actor_id'],
						},
					},
				},
			],
			alias: 'film_actor',
			nesting: {
				type: 'relational-many',
				local: { fields: ['film_id'] },
				foreign: {
					store: 'postgres',
					collection: 'film_actor',
					fields: ['film_id'],
				},
			},
			modifiers: {},
		},
	],
	modifiers: {
		limit: {
			type: 'limit',
			value: 4,
		},
	},
};

const o2mTimesTwoQuery: AbstractQuery = {
	store: 'postgres',
	collection: 'store',
	fields: [
		{
			type: 'primitive',
			field: 'store_id',
			alias: 'store_id',
		},
		{
			type: 'primitive',
			field: 'last_update',
			alias: 'last_update',
		},
		{
			type: 'nested-single-many',
			fields: [
				{
					type: 'primitive',
					field: 'customer_id',
					alias: 'customer_id',
				},
				{
					type: 'primitive',
					field: 'store_id',
					alias: 'store_id',
				},
				{
					type: 'primitive',
					field: 'first_name',
					alias: 'first_name',
				},
				{
					type: 'primitive',
					field: 'last_name',
					alias: 'last_name',
				},
				{
					type: 'nested-single-many',
					fields: [
						{
							type: 'primitive',
							field: 'payment_id',
							alias: 'payment_id',
						},
						{
							type: 'primitive',
							field: 'customer_id',
							alias: 'customer_id',
						},
						{
							type: 'primitive',
							field: 'amount',
							alias: 'amount',
						},
						{
							type: 'primitive',
							field: 'payment_date',
							alias: 'payment_date',
						},
					],
					alias: 'payment',
					nesting: {
						type: 'relational-many',
						local: { fields: ['customer_id'] },
						foreign: {
							store: 'postgres',
							collection: 'payment',
							fields: ['customer_id'],
						},
					},
					modifiers: {
						limit: {
							type: 'limit',
							value: 2,
						},
					},
				},
			],
			alias: 'customer',
			nesting: {
				type: 'relational-many',
				local: { fields: ['store_id'] },
				foreign: {
					store: 'postgres',
					collection: 'customer',
					fields: ['store_id'],
				},
			},
			modifiers: {
				limit: {
					type: 'limit',
					value: 2,
				},
			},
		},
	],
	modifiers: {
		limit: {
			type: 'limit',
			value: 2,
		},
	},
};

const engine = new DataEngine();

(async () => {
	await engine.registerStore(
		'postgres',
		new DataDriverPostgres({
			connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
		}),
	);

	const dataStream = await engine.query(o2mTimesTwoQuery);
	const chunks = [];
	console.log('START');

	for await (const record of dataStream) {
		console.dir(record, { depth: null });
		chunks.push(record);
	}

	console.log(`Length: ${chunks.length}`);

	await engine.destroy();
})();
