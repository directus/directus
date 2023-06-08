/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItem, readItems } from './commands/items/read.js';
import { useDirectus } from './index.js';

type MySchema = {
	test: {
		id: number;
		test: number | null;
		xx: string | null;
	};
	links: {
		id: number;
		name: string;
		link: string;
		date: string;
		status: string | null;
	};
};

const client = useDirectus<MySchema>({ url: 'http://localhost:8056' });

const test = readItems<'test', MySchema['test'], MySchema>({
	collection: 'test',
	query: {
		filter: {
			id: { _gt: 10 },
		},
	},
});

const readData = await client.exec(test);

console.log('readItems', readData);

// const singleItem = ;

const test2 = await client.exec(readItem({ collection: 'test', id: 1 }));

console.log('readItem', test2);
