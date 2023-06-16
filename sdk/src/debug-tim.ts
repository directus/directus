import { useDirectus } from './client.js';
import { graphql } from './graphql/composable.js';
import { readItems } from './rest/commands/read/items.js';
import { rest } from './rest/composable.js';
import type { QueryFields, QueryFieldsNested } from './types/query.js';
import type { ManyRelation, Relation } from './types/relation.js';
import type { RelationalFields } from './types/schema.js';

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

type F = QueryFields<Schema, Author>;
type A = RelationalFields<Schema, Author>;
type N = QueryFieldsNested<Schema, Author>;

const client = useDirectus<Schema>('https://rijks.website').use(rest()).use(graphql());

// const res = await client.request(
// 	readItems('articles', {
// 		fields: ['title', 'author', { author: ['name', 'friends'] }],
// 	})
// );
const res = await client.request(
	readItems('author', {
		fields: ['friends', { friends: [ 'friends', { friends}]}]
	})
);

