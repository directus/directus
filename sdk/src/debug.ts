/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItems } from './commands/read-items.js';
import { subscribe } from './commands/subscribe.js';
import { REST, /*GraphQL,*/ WebSocket, Authentication /*, Pagination*/ } from './composables/index.js';
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

/**
 * Composable client
 */
const client = useDirectus<MySchema>()
	.use(REST({ url: 'http://localhost:8056' }))
	.use(WebSocket({ url: 'ws://localhost:8056/' })) // this name collides in the browser
	.use(Authentication());
// .use(GraphQL())
// .use(Subscription())
// .use(Pagination({ pageSize: 250 }));

/**
 * REST
 */
const data = await client.request(
	readItems({
		collection: 'sss',
	})
);

/**
 * WebSocket
 */
// client.subscribe('aha', {}, console.log);

/**
 * Authentication
 */
// client.login('admin@example.com', 'admin');

/**
 * GraphQL
 */

/**
 * Subscription
 */

/**
 * Pagination
 */

// client.subscribe('test');
// const client2 = client.use(
// 	withWebSocket({
// 		url: 'ws://localhost:8056/',
// 	})
// );
// client2.subscribe('test')
// const client3 = client2.use(
// 	withGraphQL({
// 		path: '/graphql',
// 	})
// );
// client3.graphql('{ test }')
// const wsClient = withWebSocket(client, {
// 	url: 'ws://localhost:8056/',
// })
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
