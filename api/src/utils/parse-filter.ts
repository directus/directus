import { Filter, Accountability } from '../types';
import { deepMap } from './deep-map';
import { toArray } from '../utils/to-array';

export function parseFilter(filter: Filter, accountability: Accountability | null) {
	return deepMap(filter, (val, key) => {
		if (val === 'true') return true;
		if (val === 'false') return false;
		if (val === 'null' || val === 'NULL') return null;

		if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
			if (typeof val === 'string' && val.includes(',')) return val.split(',');
			else return toArray(val);
		}

		if (val === '$NOW') return new Date();
		if (val === '$CURRENT_USER') return accountability?.user || null;
		if (val === '$CURRENT_ROLE') return accountability?.role || null;

		return val;
	});
}
