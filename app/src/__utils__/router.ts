import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

export function generateRouter(routes: RouteRecordRaw[]) {
	const router = createRouter({
		history: createWebHistory(),
		routes,
	});
	return router;
}
