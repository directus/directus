import { RouteConfig } from 'vue-router';
import { replaceRoutes } from '@/router';
import modules from './index';

const moduleRoutes = modules
	.map((module) => module.routes)
	.filter((r) => r)
	.flat() as RouteConfig[];

replaceRoutes((routes) => insertBeforeProjectWildcard(routes, moduleRoutes));

export function insertBeforeProjectWildcard(currentRoutes: RouteConfig[], routesToBeAdded: RouteConfig[]) {
	// Find the index of the /* route, so we can insert the module routes right above that
	const wildcardIndex = currentRoutes.findIndex((route) => route.path === '/*');
	return [...currentRoutes.slice(0, wildcardIndex), ...routesToBeAdded, ...currentRoutes.slice(wildcardIndex)];
}
