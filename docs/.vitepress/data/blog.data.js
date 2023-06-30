export default {
	async load() {
		const articles = await (
			await fetch(
				'https://marketing.directus.app/items/articles?fields=*,user_created.first_name,user_created.last_name,user_created.avatar,user_created.title'
			)
		).json();

		let posts = articles.data.map((article) => ({
			id: article.id,
			title: article.title,
			publish_date: article.publish_date,
			summary: article.summary,
			image: article.image,
			user_created: article.user_created,
		}));

		return {
			blog: {
				articles: posts,
			},
		};
	},
};
