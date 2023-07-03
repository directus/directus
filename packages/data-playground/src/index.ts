import DataDriverPostgres from '../../data-driver-postgres/src/index.js';
import type { AbstractQuery } from '../../data/src/index.js';
import { DataEngine } from '../../data/src/index.js';

const engine = new DataEngine();

await engine.registerStore('postgres', new DataDriverPostgres({
	connectionString: 'postgresql://postgres:secret@localhost:5100/data'
}));

const query: AbstractQuery = {
	root: true,
	store: 'postgres',
	collection: 'articles',
	nodes: [
		{
			type: 'primitive',
			field: 'id',
		},
		{
			type: 'primitive',
			field: 'title',
		},
		{
			type: 'm2o',
			join: {
				current: {
					fields: ['author']
				},
				external: {
					store: 'postgres',
					collection: 'authors',
					fields: ['id']
				}
			},
			nodes: [
				{
					type: 'primitive',
					field: 'name',
				}
			],
		}
	]
}

const dataStream = await engine.query(query);

dataStream.on('data', (data) => {
	console.log(data);
});

await engine.destroy();
