import { useUserStore } from '@/stores';
import { deepMap } from './deep-map';

export function parseFilter(
	filter: Record<string, any>,
	values: Record<string, unknown> | null = null
): Record<string, any> {
	const userStore = useUserStore();

	return deepMap(filter, (val: any, key: string) => {
		if (val === 'true') return true;
		if (val === 'false') return false;

		if (key === '_in' || key === '_nin') {
			if (typeof val === 'string' && val.includes(',')) return val.split(',');
			else return Array.isArray(val) ? val : [val];
		}

		if (val === '$NOW') return new Date();
		if (val === '$CURRENT_USER') return userStore?.currentUser?.id || null;
		if (val === '$CURRENT_ROLE') return userStore?.currentUser?.role?.id || null;

		const match = typeof val === 'string' ? /^\$VALUE\((.+?)\)$/.exec(val) : null;
		if (match !== null) {
			const field = match[1];
			if (!values) {
				// eslint-disable-next-line no-console
				console.warn('⚠️ It is not possible to apply the dynamic filter becouse the current item is not defined.');
			} else {
				return values[field];
			}
		}

		return val;
	});
}
