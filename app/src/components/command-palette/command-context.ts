import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { CommandAvailableContext } from './composables/use-command-registry';

export interface RootCommandContext extends CommandAvailableContext {
	routePath: string;
}

export function getCommandContext(route: RouteLocationNormalizedLoaded, search: string): RootCommandContext {
	return {
		route,
		routePath: route.fullPath,
		search,
	};
}
