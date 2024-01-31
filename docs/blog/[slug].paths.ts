import { readItems } from '@directus/sdk';
import { client } from '../.vitepress/lib/directus.js';

export default {
	async paths() {
		const articles = (
			await client.request(
				readItems('developer_articles', {
					fields: [
						'*',
						{ author: ['first_name', 'last_name', 'avatar', 'title'] },
						{ tags: [{ docs_tags_id: ['title', 'slug', 'type'] }] },
					],
				}),
			)
		).map((article) => ({
			params: {
				slug: article.slug,
				title: article.title,
				date_published: article.date_published,
				summary: article.summary,
				image: article.image,
				author: article.author,
				tags: article.tags.map((tag) => ({
					title: tag.docs_tags_id.title,
					slug: tag.docs_tags_id.slug,
					type: tag.docs_tags_id.type,
				})),
				contributors: article.contributors,
			},
			content: article.content,
		}));

		return articles;
	},
};
