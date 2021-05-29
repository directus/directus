import { defineModule } from '@/modules/define';
import files, { Directory } from '@directus/docs';
import { RouteRecordRaw } from 'vue-router';
import NotFound from './routes/not-found.vue';
import StaticDocs from './routes/static.vue';

export default defineModule(() => {
	const routes: RouteRecordRaw[] = [
		{
			path: '',
			redirect: '/docs/getting-started/introduction/',
		},
		...parseRoutes(files),
		{
			path: ':_(.+)+',
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

	function parseRoutes(directory: Directory): RouteRecordRaw[] {
		const routes: RouteRecordRaw[] = [];

		for (const doc of directory.children) {
			if (doc.type === 'file') {
				routes.push({
					path: doc.path.replace('.md', ''),
					component: StaticDocs,
				});
			} else if (doc.type === 'directory') {
				if (doc.path && doc.children && doc.children.length > 0)
					routes.push({
						path: doc.path.replace('.md', ''),
						redirect: '/' + doc.children![0].path.replace('.md', ''),
					});

				routes.push(...parseRoutes(doc));
			}
		}
		return routes;
	}
});
