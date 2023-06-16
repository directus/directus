import { useDirectus } from './client.js';
import { graphql } from './graphql/composable.js';
import { readItems } from './rest/commands/read/items.js';
import { rest } from './rest/composable.js';

interface Article {
	id: number;
	title: string;
	author: Author | string;
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

const res = both.request(readItems('articles', { fields: ['title', 'author', { author: ['name'] }] }));
