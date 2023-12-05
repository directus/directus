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
	collection: 'authors',
	fields: [
		{
			type: 'primitive',
			field: 'name',
			alias: 'fistName',
		},
		{
			type: 'nested-single-many',
			fields: [
				{
					type: 'primitive',
					field: 'title',
					alias: 'as',
				},
			],
			alias: 'sd',
			nesting: {
				type: 'relational-many',
				local: { fields: ['id'] },
				foreign: {
					store: 'postgres',
					collection: 'articles',
					fields: ['author'],
				},
			},
			modifiers: {},
		},
	],
	modifiers: {},
};

const engine = new DataEngine();

(async () => {
	await engine.registerStore(
		'postgres',
		new DataDriverPostgres({
			connectionString: 'postgresql://postgres:moinmoin@localhost:5432/increment_test',
		}),
	);

	const dataStream = await engine.query(o2mQuery);
	const chunks = [];
	console.log(1);

	for await (const record of dataStream) {
		console.log(record);
		chunks.push(record);
	}

	console.log('hallo');
	console.log(chunks.length);
	console.log(JSON.stringify(chunks, null, 2));

	await engine.destroy();
})();
