const tagBaseUrl = '/blog/tags';

export default {
	async load() {
		const { data: articles } = await (
			await fetch(
				'https://marketing.directus.app/items/developer_articles?fields=*,author.first_name,author.last_name,author.avatar,author.title,tags.directus_tags_id.title,tags.directus_tags_id.slug,tags.directus_tags_id.type&sort=-date_published'
			)
		).json();

		const { data: tags } = await (
			await fetch('https://marketing.directus.app/items/docs_tags?fields=*&sort=-count(developer_articles)')
		).json();

		let posts = articles.map((article) => ({
			id: article.slug,
			title: article.title,
			date_published: article.date_published,
			summary: article.summary,
			image: article.image,
			author: article.author,
		}));

		// Create tags for the sidebar
		let tagsForSidebar = [];

		tags.forEach((tag) => {
			// If tag has no articles, don't add it to the sidebar
			if (!tag.developer_articles.length) return;

			tagsForSidebar.push({
				text: tag.title,
				link: `${tagBaseUrl}/${tag.slug}`,
			});
		});

		return {
			blog: {
				articles: posts,
				tags,
				tagsForSidebar,
			},
		};
	},
};
