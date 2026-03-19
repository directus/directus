import { useRouteQuery } from '@vueuse/router';

export function useVersionQuery() {
	return useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
	});
}
