import { RouteConfig } from 'vue-router';
import { replaceRoutes } from '@/router';
import modules from './index';

const moduleRoutes: RouteConfig[] = modules.map((module) => module.routes).flat();

replaceRoutes((routes) => insertBeforeProjectWildcard(routes, moduleRoutes));

export function insertBeforeProjectWildcard(
	currentRoutes: RouteConfig[],
	routesToBeAdded: RouteConfig[]
) {
	// Find the index of the /:project/* route, so we can insert the module routes right above that
	const wildcardIndex = currentRoutes.findIndex((route) => route.path === '/:project/*');
	return [
		...currentRoutes.slice(0, wildcardIndex),
		...routesToBeAdded,
		...currentRoutes.slice(wildcardIndex),
	];
}
