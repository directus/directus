/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItems } from './commands/read-items.js';
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

const readData = await client.exec(
	readItems({
		collection: 'test',
		query: {
			filter: {
				id: { _gt: 10 },
			},
		},
	})
);

readData.forEach((item) => {
	item.test;
});

console.log('readItems', readData);

// const singleItem = ;
const test = readItems({ collection: 'test' });

const test2 = await client.exec(test);

test2.forEach((item) => {
	item.test;
});

console.log('readItem', test2);

// client.socket(readItems());

// client.exec(subscribe());

// const client = withSubscriptions(withGraphQL(client));

// client.graphql(`
// 	subscribe {
// 		articles {
// 			id
// 		}
// 	}
// `);

// const client = withWebSockets(client);
// client.subscribe(readItems());

// const client = withPagination(client);
// const iterator = client.paginate(readItems());

// for await (const page of iterator) {

// }
