export default {
	async paths() {
		const response = await (
			await fetch(
				'https://marketing.directus.app/items/docs_tags?fields=*,developer_articles.developer_articles_id.title,developer_articles.developer_articles_id.date_published,developer_articles.developer_articles_id.slug,developer_articles.developer_articles_id.image,developer_articles.developer_articles_id.author.first_name,developer_articles.developer_articles_id.author.last_name,developer_articles.developer_articles_id.author.avatar,author.title,developer_articles.developer_articles_id.status'
			)
		).json();

		let tags = response.data.map((tag) => ({
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
					.sort((a, b) => new Date(b.date_published) - new Date(a.date_published)),
			},
		}));

		return tags;
	},
};
