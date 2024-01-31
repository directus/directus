import { readItems } from '@directus/sdk';
import { client } from '../../.vitepress/lib/directus.js';

export default {
	async paths() {
		const tags = (
			await client.request(
				readItems('docs_tags', {
					fields: [
						'*',
						{
							developer_articles: [
								{
									developer_articles_id: [
										'title',
										'date_published',
										'slug',
										'image',
										{ author: ['first_name', 'last_name', 'avatar', 'title'] },
										'status',
									],
								},
							],
						},
					],
				}),
			)
		).map((tag) => ({
			params: {
				slug: tag.slug,
				title: tag.title,
				type: tag.type,
				articles: tag.developer_articles
					.map((article) => {
						if (!article.developer_articles_id) return;
						if (article.developer_articles_id.status !== 'published') return;

						return {
							title: article.developer_articles_id.title,
							slug: article.developer_articles_id.slug,
							date_published: article.developer_articles_id.date_published,
							image: article.developer_articles_id.image,
							author: article.developer_articles_id.author,
						};
					})
					.filter((article) => article)
					.sort((a, b) => +new Date(b!.date_published) - +new Date(a!.date_published)),
			},
		}));

		return tags;
	},
};
