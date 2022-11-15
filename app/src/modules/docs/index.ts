import { defineModule } from '@directus/shared/utils';
import docs, { DocsRoutes } from '@directus/docs';
import { RouteRecordRaw } from 'vue-router';
import NotFound from './routes/not-found.vue';
import StaticDocs from './routes/static.vue';

export default defineModule({
	id: 'docs',
	name: '$t:documentation',
	icon: 'help_outline',
	routes: [
		{
			name: 'docs-routes',
			path: '',
			component: StaticDocs,
			children: [
				{
					name: 'docs-app-overview-redirect',
					path: '',
					redirect: '/docs/app/overview',
				},
				...getRoutes(docs),
			],
		},
		{
			path: ':_(.+)+',
			component: NotFound,
		},
	],
});

function getRoutes(routes: DocsRoutes): RouteRecordRaw[] {
	const updatedRoutes: RouteRecordRaw[] = [];

	for (const route of routes) {
		if (!('children' in route)) {
			updatedRoutes.push({
				name: `docs-${route.path.replace('/', '-')}`,
				path: route.path,
				component: route.import,
			});
		} else {
			updatedRoutes.push({
				path: route.path,
				redirect: `/docs/${route.children[0].path}`,
			});

			updatedRoutes.push(...getRoutes(route.children));
		}
	}

	return updatedRoutes;
}
