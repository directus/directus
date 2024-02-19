import { readItems } from '@directus/sdk';
import { defineLoader } from 'vitepress';
import { client } from '../lib/directus.js';

export default defineLoader({
	async load() {
		const articles = (
			await client.request(
				readItems('developer_articles', {
					fields: [
						'*',
						{ author: ['first_name', 'last_name', 'avatar', 'title'] },
						{ tags: [{ directus_tags_id: ['title', 'slug', 'type'] }] },
					],
					filter: {
						status: { _eq: 'published' },
					},
					sort: '-date_published',
				}),
			)
		).map((article) => ({
			id: article.slug,
			title: article.title,
			date_published: article.date_published,
			summary: article.summary,
			image: article.image,
			author: article.author,
		}));

		const tags = await client.request(
			readItems('docs_tags', {
				// @ts-ignore
				sort: '-count(developer_articles)',
			}),
		);

		return {
			blog: {
				articles,
				tags,
			},
		};
	},
});
