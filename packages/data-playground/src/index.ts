import DataDriverPostgres from '../../data-driver-postgres/src/index.js';
import type { AbstractQuery } from '../../data/src/index.js';
import { DataEngine } from '../../data/src/index.js';
import { streamToString } from './stream-to-string.js';

console.log('Creating engine...');

const engine = new DataEngine();

console.log('Registering Postgres...');

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
		}
	]
}

console.log('Executing query...');

const dataStream = await engine.query(query);
const output = await streamToString(dataStream);

console.log();
console.log(output);
console.log();

console.log('Destroying...');
await engine.destroy();
