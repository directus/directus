import type { RouteLocationNormalizedLoaded } from 'vue-router';

export interface RouteVersionContext {
	versionKey: string | undefined;
	versionId: string | undefined;
	isVersionContext: boolean;
	isItemlessDraft: boolean;
}

export function getRouteVersionContext(route: RouteLocationNormalizedLoaded): RouteVersionContext {
	const versionKey = getStringQueryValue(route.query.version);
	const versionId = getStringQueryValue(route.query.versionId);
	const primaryKey = route.params.primaryKey;
	const isVersionContext = versionKey !== undefined;

	return {
		versionKey,
		versionId,
		isVersionContext,
		isItemlessDraft: isVersionContext && primaryKey === '+' && versionId !== undefined,
	};
}

function getStringQueryValue(value: unknown) {
	if (Array.isArray(value)) return getStringQueryValue(value[0]);
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}
