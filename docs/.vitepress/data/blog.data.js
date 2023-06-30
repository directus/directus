export default {
	async load() {
		const articles = await (
			await fetch(
				'https://marketing.directus.app/items/developer_articles?fields=*,author.first_name,author.last_name,author.avatar,author.title'
			)
		).json();

		const blogSettings = await (
			await fetch(
				'https://marketing.directus.app/items/developer_blog?fields=featured_article.*,featured_article.author.first_name,featured_article.author.last_name,featured_article.author.avatar,featured_article.author.title'
			)
		).json();

		let posts = articles.data.map((article) => ({
			id: article.id,
			title: article.title,
			date_published: article.date_published,
			summary: article.summary,
			image: article.image,
			author: article.author,
		}));

		return {
			blog: {
				featured: blogSettings.data.featured_article,
				articles: posts,
			},
		};
	},
};
