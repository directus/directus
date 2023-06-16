import { useDirectus } from './client.js';
import { graphql } from './graphql/composable.js';
import { readItems } from './rest/commands/read/items.js';
import { rest } from './rest/composable.js';
import type { PrimaryKey } from '@directus/types';

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

interface Author {
	id: string;
	name: string;
	friends: ManyRelation<Author, string>;
	test: Relation<Author, string>;
}

interface Schema {
	articles: Article;
	author: Author;
}

const client = useDirectus<Schema>('https://rijks.website').use(rest()).use(graphql());
// .use(ws())

// const res = await client.request(
// 	readItems('articles', {
// 		fields: ['title', 'author', { author: ['name', 'friends'] }],
// 	})
// );
const res = await client.request(
	readItems('author', {
		fields: ['friends', { friends: ['friends', { friends: [{ friends: ['*'] }] }] }],
	})
);
