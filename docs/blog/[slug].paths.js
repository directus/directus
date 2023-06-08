export default {
	async paths() {
		const articles = await (await fetch('https://marketing.directus.app/items/articles')).json();

		let posts = articles.data.map((article) => ({
			params: {
				slug: article.id,
				title: article.title,
				publish_date: article.publish_date,
				summary: article.summary,
				image: article.image,
				user_created: article.user_created,
			},
			content: article.body,
		}));

		return posts;
	},
};
