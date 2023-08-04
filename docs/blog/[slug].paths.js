export default {
	async paths() {
		const articles = await (
			await fetch(
				'https://marketing.directus.app/items/developer_articles?fields=*,author.first_name,author.last_name,author.avatar,author.title,tags.docs_tags_id.title,tags.docs_tags_id.slug,tags.docs_tags_id.type'
			)
		).json();

		let posts = articles.data.map((article) => ({
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

		return posts;
	},
};
