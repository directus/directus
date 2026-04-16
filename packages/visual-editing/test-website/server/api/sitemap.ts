import { directusServer, readItems } from '../utils/directus-server';
import type { SitemapUrlInput } from '#sitemap/types';

export default defineSitemapEventHandler(async () => {
	try {
		const pages = await directusServer.request(
			readItems('pages', {
				fields: ['permalink'],
			}),
		);

		const posts = await directusServer.request(
			readItems('posts', {
				filter: { status: { _eq: 'published' } },
				fields: ['slug'],
			}),
		);

		const pageUrls = pages.map((page) => ({
			loc: `/${page.permalink}`,
		}));

		const postUrls = posts.map((post) => ({
			loc: `/posts/${post.slug}`,
		}));

		return [...pageUrls, ...postUrls] satisfies SitemapUrlInput[];
	} catch {
		return [];
	}
});
