import { Accountability, Filter } from '../types';
import { toArray } from './to-array';
import { adjustDate } from './adjust-date';
import { deepMap } from './deep-map';

export function parseFilter(
	filter: Filter,
	accountability: Accountability | null,
	values: Record<string, unknown> | null = null
): any {
	return deepMap(filter, (val, key) => {
		if (val === 'true') return true;
		if (val === 'false') return false;
		if (val === 'null' || val === 'NULL') return null;

		if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
			if (typeof val === 'string' && val.includes(',')) return val.split(',');
			else return toArray(val);
		}

		if (val && typeof val === 'string' && val.startsWith('$NOW')) {
			if (val.includes('(') && val.includes(')')) {
				const adjustment = val.match(/\(([^)]+)\)/)?.[1];
				if (!adjustment) return new Date();
				return adjustDate(new Date(), adjustment);
			}

			return new Date();
		}

		if (val === '$CURRENT_USER') return accountability?.user || null;
		if (val === '$CURRENT_ROLE') return accountability?.role || null;

		const match = typeof val === 'string' ? /^\$VALUE\((.+?)\)$/.exec(val) : null;
		if (match !== null && match[1]) {
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
