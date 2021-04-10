import { defineModule } from '@/modules/define';
import { RouteConfig } from 'vue-router';
import files, { Directory } from '@directus/docs';
import StaticDocs from './routes/static.vue';
import NotFound from './routes/not-found.vue';

export default defineModule(() => {
	const routes: RouteConfig[] = [
		{
			path: '/',
			redirect: '/getting-started/introduction/',
		},
		...parseRoutes(files),
		{
			path: '/*',
			component: NotFound,
		},
	];

	return {
		id: 'docs',
		name: '$t:documentation',
		icon: 'info',
		routes,
		order: 20,
	};

	function parseRoutes(directory: Directory): RouteConfig[] {
		const routes: RouteConfig[] = [];

		for (const doc of directory.children) {
			if (doc.type === 'file') {
				routes.push({
					path: '/' + doc.path.replace('.md', ''),
					component: StaticDocs,
				});
			} else if (doc.type === 'directory') {
				if (doc.path && doc.children && doc.children.length > 0)
					routes.push({
						path: '/' + doc.path.replace('.md', ''),
						redirect: '/' + doc.children![0].path.replace('.md', ''),
					});

				routes.push(...parseRoutes(doc));
			}
		}
		return routes;
	}
});
