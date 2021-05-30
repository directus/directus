import { defineModule } from '@/modules/define';
import routerPassthrough from '@/utils/router-passthrough';
import docs, { DocsRoutes } from '@directus/docs';
import { RouteRecordRaw } from 'vue-router';
import NotFound from './routes/not-found.vue';
import StaticDocs from './routes/static.vue';

export default defineModule(() => {
	const routes: RouteRecordRaw[] = [
		{
			path: '',
			redirect: '/docs/getting-started/introduction/',
		},
		...getRoutes(docs),
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

	function getRoutes(routes: DocsRoutes): RouteRecordRaw[] {
		return routes.map((route) => {
			if (!('children' in route)) {
				return {
					path: route.name,
					component: StaticDocs,
					meta: {
						import: route.import,
					},
				};
			} else {
				return {
					path: route.name,
					redirect: `/docs/${route.children[0].path}`,
					component: routerPassthrough(),
					children: getRoutes(route.children),
				};
			}
		});
	}
});
