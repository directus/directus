import { Filter, Accountability } from '../types';
import { deepMap } from './deep-map';

export function parseFilter(filter: Filter, accountability: Accountability | null) {
	return deepMap(filter, (val: any) => {
		if (val === '$NOW') return new Date();
		if (val === '$CURRENT_USER') return accountability?.user || null;
		if (val === '$CURRENT_ROLE') return accountability?.role || null;

		return val;
	});
}
