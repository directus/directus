import fetch from 'node-fetch';
import { loadEnv } from 'vitepress';

const secrets = loadEnv('', process.cwd());

const env = {
	url: secrets.VITE_DIRECTUS_URL,
	token: secrets.VITE_DIRECTUS_TOKEN,
};

const fields = [
	'featured.*.title',
	'featured.*.main',
	'featured.*.category',
	'featured.*.publish_date',
	'featured.*.user_created.first_name',
	'featured.*.user_created.last_name',
	'featured.*.image.filename_disk',
];

async function getArticles() {
	const response = await fetch(`${env.url}/items/blog?fields[]=${fields}`, {
		headers: {
			Authorization: `Bearer ${env.token}`,
		},
	});

	return response.json();
}

export default {
	async load() {
		const articles = await getArticles();
		const data = articles.data.featured;

		const transformedData = data.map((article) => {
			const { title, category, publish_date, user_created, image } = article.articles_id;
			return {
				title,
				category,
				publish_date,
				author: `${user_created.first_name} ${user_created.last_name}`,
				image: `${env.url}/assets/${image.filename_disk}`,
				slug: `https://directus.io/blog/${article.blog_id.main}`,
			};
		});

		return {
			data: transformedData,
		};
	},
};
