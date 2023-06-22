/* eslint-disable prettier/prettier */
import { useDirectus } from './client.js';
import { graphql } from './graphql/composable.js';
import { readItems } from './rest/commands/read/items.js';
import { rest } from './rest/composable.js';
import { realtime } from './realtime/composable.js';
import type { PrimaryKey } from '@directus/types';
import WebSocket from 'ws';

//@ts-ignore
globalThis.WebSocket = WebSocket;

type Relation<RelatedItem extends object, FieldType> = RelatedItem | FieldType;

type ManyRelation<RelatedItem extends object, FieldType> = RelatedItem[] | FieldType[];

type AnyRelation<RelatedItems extends object> = {
	collection: RelatedItems;
	item: PrimaryKey;
}[];

interface Article {
	id: number;
	title: string;
	author: Relation<Author, string>;
}

interface Test {
	id: number;
	test: string;
}

interface Author {
	id: string;
	name: string;
	friends: ManyRelation<Author, string>;
	test: Relation<Author, string>;
}

interface Schema {
	articles: Article;
	author: Author;
	test: Test;
}

const client = useDirectus<Schema>('http://localhost:8056/')
	.use(rest())
	.use(graphql())
	.use(realtime({
		authMode: 'public',
	}));

const { subscription, unsubscribe } = await client.subscribe('test', {
	query: {
		fields: ['*']
	},
})

setTimeout(() => {
	unsubscribe();
	client.disconnect();
}, 60000);

for await (const item of subscription) {
	console.log({ item });

}
// const res = await client.request(
// 	readItems('articles', {
// 		fields: ['title', 'author', { author: ['name', 'friends'] }],
// 	})
// );

// const result = await client.request(
// 	readItems('author', {
// 		fields: [
// 			'*', 'friends', 
// 			{ friends: [
// 				{ friends: [
// 					'id',
// 					'name',
// 					{ friends: ['*'] }
// 				] }
// 			] }
// 		],
// 	})
// );

// result.friends.friends.friends.name;