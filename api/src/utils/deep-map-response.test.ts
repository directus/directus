import { expect, test } from 'vitest';
import { deepMapResponse } from './deep-map-response.js';
import { SchemaBuilder } from '@directus/schema-builder';

const data = {
	id: 1,
	title: 'Article 12',
	author: null,
	tags: [
		{
			id: 1,
			articles_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
			tags_id: {
				id: 1,
				tag_name: 'Tag1',
				articles: [1],
			},
		},
		{
			id: 2,
			articles_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
			tags_id: {
				id: 2,
				tag_name: 'Tag2',
				articles: [2],
			},
		},
		{
			id: 3,
			articles_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
			tags_id: {
				id: 3,
				tag_name: 'Tag3',
				articles: [3],
			},
		},
		{
			id: 13,
			articles_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
			tags_id: {
				id: 13,
				tag_name: 'Tag4',
				articles: [13],
			},
		},
		{
			tags_id: {
				tag_name: 'Tag4',
			},
		},
	],
	links: [
		{
			id: 1,
			name: 'Link1',
			article_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
		},
		{
			id: 2,
			name: 'Link222',
			article_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
		},
	],
	sections: [
		{
			id: 1,
			collection: 'sec_num',
			articles_id: {
				id: 1,
				title: 'Article 12',
				author: null,
				tags: [1, 2, 3, 13],
				links: [1, 2],
				sections: [1],
			},
			item: {
				id: 1,
				num: 1,
			},
		},
	],
};

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('users');
		c.field('tags').m2m('tags');
		c.field('links').o2m('links', 'article_id');
		c.field('sections').m2a(['sec_num', 'sec_text']);
	})
	.collection('users', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
	})
	.collection('links', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('sec_num', (c) => {
		c.field('id').id();
		c.field('num').integer();
	})
	.collection('sec_text', (c) => {
		c.field('id').id();
		c.field('text').text();
	})
	.build();

test('map m2o', () => {
	const result = deepMapResponse(
		data,
		(entry, context) => {
			if (context.collection.collection === 'articles' && context.field.field === 'id') {
				return ['id', 'Yoo'];
			}

			return entry;
		},
		{ schema: schema, collection: 'articles' },
	);

	expect(result).toMatchInlineSnapshot(`
		{
		  "author": null,
		  "id": "Yoo",
		  "links": [
		    {
		      "article_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 1,
		      "name": "Link1",
		    },
		    {
		      "article_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 2,
		      "name": "Link222",
		    },
		  ],
		  "sections": [
		    {
		      "articles_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "collection": "sec_num",
		      "id": 1,
		      "item": {
		        "id": 1,
		        "num": 1,
		      },
		    },
		  ],
		  "tags": [
		    {
		      "articles_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 1,
		      "tags_id": {
		        "articles": [
		          1,
		        ],
		        "id": 1,
		        "tag_name": "Tag1",
		      },
		    },
		    {
		      "articles_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 2,
		      "tags_id": {
		        "articles": [
		          2,
		        ],
		        "id": 2,
		        "tag_name": "Tag2",
		      },
		    },
		    {
		      "articles_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 3,
		      "tags_id": {
		        "articles": [
		          3,
		        ],
		        "id": 3,
		        "tag_name": "Tag3",
		      },
		    },
		    {
		      "articles_id": {
		        "author": null,
		        "id": "Yoo",
		        "links": [
		          1,
		          2,
		        ],
		        "sections": [
		          1,
		        ],
		        "tags": [
		          1,
		          2,
		          3,
		          13,
		        ],
		        "title": "Article 12",
		      },
		      "id": 13,
		      "tags_id": {
		        "articles": [
		          13,
		        ],
		        "id": 13,
		        "tag_name": "Tag4",
		      },
		    },
		    {
		      "tags_id": {
		        "tag_name": "Tag4",
		      },
		    },
		  ],
		  "title": "Article 12",
		}
	`);
});
