import { useDirectus } from './client.js';
import { graphql } from './graphql/composable.js';
import { rest } from './rest/composable.js';

interface Article {
	id: number;
	title: string;
	author: string | Author;
}

interface Author {
	id: string;
	name: string;
}

interface Schema {
	articles: Article;
	author: Author;
}

const client = useDirectus<Schema>('https://rijks.website');
const restClient = client.use(rest());
const both = restClient.use(graphql());

// /**
//  * File to run some tests / experiments. Not intended for prod usage
//  */
// import { readItems } from './commands/read-items.js';
// import { REST, GraphQL, RealTime, Authentication /*, Pagination*/ } from './composables/index.js';
// import type { GqlResult } from './composables/index.js';
// import { useDirectus, type Relation } from './index.js';

// type TestCollection = {
// 	id: number;
// 	test: number | null;
// 	xx: string | null;
// };

// type LinksCollection = {
// 	id: number;
// 	name: string;
// 	link: string;
// 	date: string;
// 	status: string | null;
// 	test_rel: Relation<TestCollection>;
// };

// type MySchema = {
// 	test: TestCollection;
// 	links: LinksCollection;
// 	directus_users: {
// 		first_name: string;
// 		last_name: string;
// 	};
// };

// /**
//  * Composable client
//  */
// const client = useDirectus<MySchema>({
// 	url: 'http://localhost:8056/',
// 	token: 'admin',
// })
// 	.use(REST())
// 	.use(GraphQL())
// 	.use(RealTime({ url: 'ws://localhost:8056/websocket' }));
// // .use(Authentication());
// // .use(Pagination({ pageSize: 250 }));

// /**
//  * Authentication
//  */
// // await client.login('admin@example.com', 'd1r3ctu5');

// /**
//  * REST
//  */
// const data = await client.request(
// 	readItems('links', {
// 		fields: [
// 			'id',
// 			{
// 				test_rel: ['id'],
// 			},
// 		],
// 		// ['*', 'id', 'name', 'test_rel.*'],
// 	})
// );

// /**
//  * GraphQL
//  *
//  * Absolutely not sure if we can do more than this typewise for gql
//  */
// const data2 = await client.graphql<GqlResult<MySchema, 'test'>>(`
// query {
// 	test(limit: 2) {
// 		id
// 		test
// 	}
// }`);

// // console.log(data2.test);

// /**
//  * WebSocket
//  */
// await client.connect();

// const { subscription } = client.subscribe('test', {
// 	// event: 'update',
// 	query: {
// 		fields: ['*'],
// 		limit: 2,
// 	},
// });

// for await (const data of subscription) {
// 	console.log('data', data);
// }

// /**
//  * Subscription
//  */

// /**
//  * Pagination
//  */

// // const client = withPagination(client);
// // const iterator = client.paginate(readItems());
// // for await (const page of iterator) {
// // }
