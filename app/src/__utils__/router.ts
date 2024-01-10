import { h } from 'vue';
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

export function generateRouter(routes?: RouteRecordRaw[]) {
	const router = createRouter({
		history: createWebHistory(),
		routes: routes ?? [
			{
				path: '/',
				component: h('div'),
			},
		],
	});

	return router;
}
