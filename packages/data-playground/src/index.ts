import DataDriverPostgres from '../../data-driver-postgres/src/index.js';
import type { AbstractQuery } from '../../data/src/index.js';
import { DataEngine } from '../../data/src/index.js';
import { streamToString } from './stream-to-string.js';

const engine = new DataEngine();

await engine.registerStore('postgres', new DataDriverPostgres({
	connectionString: 'postgresql://postgres:secret@localhost:5100/directus'
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
		}
	]
}

const dataStream = await engine.query(query);

const output = await streamToString(dataStream);

console.log(output);

await engine.destroy();
