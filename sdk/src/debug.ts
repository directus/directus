/**
 * File to run some tests / experiments. Not intended for prod usage
 */
import { readItems } from './commands/read-items.js';
import { subscribe } from './commands/subscribe.js';
import {
	withHttpAuthentication,
	withWebSocket,
	withWebSocketAuthentication,
	withGraphQL,
	withSubscriptions,
	withPagination,
} from './decorators/index.js';
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
 * EXPERIMENT 1:
 */

/*
const client = withSubscriptions(withGraphQL(client, {
	path: 'test
}), {
	url: 'ws://localhost:8056/test'
});

// client.graphql(`
// 	subscribe {
// 		articles {
// 			id
// 		}
// 	}
// `);

/**
 * EXPERIMENT 2: Composing features using an array
 */

// const client = useDirectus<MySchema>({ url: 'http://localhost:8056' }, [
// 	// withHttpAuthentication(),
// 	withWebSocket({
// 		url: 'ws://localhost:8056/',
// 	}),
// // 	withWebSocketAuthentication(),
// 	// withGraphQL(),
// // 	withSubscriptions(),
// // 	withPagination(),
// ]);

/**
 * EXPERIMENT 3: Composing features using a chainable `.use` function
 */
const client = useDirectus<MySchema>({ url: 'http://localhost:8056' });

const client2 = client.use(
	withWebSocket({
		url: 'ws://localhost:8056/',
	})
);

const client3 = client2.use(
	withGraphQL({
		path: '/graphql',
	})
);

// const wsClient = withWebSocket(client, {
// 	url: 'ws://localhost:8056/',
// });

// const result = wsClient.exec(
// 	subscribe({
// 		collection: 'test',
// 		uid: 'test-123',
// 	})
// );
/**
 * Ik denk dat dit gebruiksvriendelijker is uiteindelijk
 * 
const something = await subscribe(wsClient, {
	collection: 'test',
	uid: 'test-123',
})
const result = await readItems(client, { collection: 'test' })
 */

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
