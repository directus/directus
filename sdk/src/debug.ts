/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItems } from './commands/read-items.js';
import { subscribe } from './commands/subscribe.js';
import { REST, GraphQL, WebSocket, Authentication /*, Pagination*/ } from './composables/index.js';
import type { GqlResult } from './composables/index.js';
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
	directus_users: {
		first_name: string;
		last_name: string;
	};
};

/**
 * Composable client
 */
const client = useDirectus<MySchema>({
	url: 'http://localhost:8056/',
	token: 'admin',
})
	.use(REST())
	.use(GraphQL())
	.use(WebSocket({ url: 'ws://localhost:8056/websocket' })); // this name collides in the browser
// .use(Authentication());
// .use(Subscription())
// .use(Pagination({ pageSize: 250 }));

/**
 * Authentication
 */
// await client.login('admin@example.com', 'd1r3ctu5');

/**
 * REST
 */
const data = await client.request(
	readItems({
		collection: 'test',
		query: {
			limit: 2,
		},
	})
);

console.log(data);

/**
 * GraphQL
 *
 * Absolutely not sure if we can do more than this typewise for gql
 */
const data2 = await client.graphql<GqlResult<MySchema, 'test'>>(`
query {
	test(limit: 2) {
		id
		test
	}
}`);

console.log(data2.test);

/**
 * WebSocket
 */
await client.connect();

const { subscription } = client.subscribe('test', {
	// event: 'update',
	query: {
		fields: ['*'],
		limit: 2,
	},
});

for await (const data of subscription) {
	console.log('data', data);
}

/**
 * Subscription
 */

/**
 * Pagination
 */

// const result = wsClient.exec(
// 	subscribe({
// 		collection: 'test',
// 		uid: 'test-123',
// 	})
// );
// const readData = await client.exec(
// 	readItems({
// 		collection: 'test',
// 		query: {
// 			filter: {
// 				id: { _gt: 10 },
// 			},
// 		},
// 	})
// );
// readData.forEach((item) => {
// 	item.test;
// });
// console.log('readItems', readData);
// // const singleItem = ;
// const test = readItems({ collection: 'test' });
// const test2 = await client.exec(test);
// test2.forEach((item) => {
// 	item.test;
// });
// console.log('readItem', test2);
// client.socket(readItems());
// client.exec(subscribe());
// const client = withWebSockets(client);
// client.subscribe(readItems());
// const client = withPagination(client);
// const iterator = client.paginate(readItems());
// for await (const page of iterator) {
// }
