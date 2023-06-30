export default {
	async paths() {
		const articles = await (
			await fetch(
				'https://marketing.directus.app/items/developer_articles?fields=*,author.first_name,author.last_name,author.avatar,author.title'
			)
		).json();

		let posts = articles.data.map((article) => ({
			params: {
				slug: article.id,
				title: article.title,
				date_published: article.date_published,
				summary: article.summary,
				image: article.image,
				author: article.author,
			},
			content: article.content,
		}));

		return posts;
	},
};
