import { deepMap } from './deep-map';
import { useUserStore } from '@/stores';

export function parseFilter(filter: Record<string, any>): Record<string, any> {
	const userStore = useUserStore();

	return deepMap(filter, (val: any, key: string) => {
		if (val === 'true') return true;
		if (val === 'false') return false;

		if (key === '_in' || key === '_nin') {
			if (typeof val === 'string' && val.includes(',')) return val.split(',');
			else return Array.isArray(val) ? val : [val];
		}

		if (val === '$NOW') return new Date();
		if (val === '$CURRENT_USER') return userStore.state?.currentUser?.id || null;
		if (val === '$CURRENT_ROLE') return userStore.state?.currentUser?.role?.id || null;

		return val;
	});
}
