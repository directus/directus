import { useDirectus } from './client.js';
import { readItems } from './rest/commands/read/items.js';
import { rest } from './rest/composable.js';
import type { ApplyQueryFields, Query } from './types/query.js';

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

const client = useDirectus<Schema>('https://rijks.website').use(rest());

const res = client.request(readItems('author', { fields: undefined }));

type Q = Query<Schema, Article>;

const query: Q = {
	fields: ['id', 'title', { author: ['name'] }],
};

type Output = ApplyQueryFields<Schema, Article, undefined>;
