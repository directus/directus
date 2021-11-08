import { REGEX_BETWEEN_PARENS } from '../constants';
import { Accountability, Filter, User, Role } from '../types';
import { toArray } from './to-array';
import { adjustDate } from './adjust-date';
import { deepMap } from './deep-map';
import { isDynamicVariable } from './is-dynamic-variable';

type ParseFilterContext = {
	// The user can add any custom fields to user
	$CURRENT_USER?: User & { [field: string]: any };
	$CURRENT_ROLE?: Role & { [field: string]: any };
};

export function parseFilter(
	filter: Filter | null,
	accountability: Accountability | null,
	context: ParseFilterContext = {}
): any {
	if (!filter) return filter;

	return deepMap(filter, applyFilter);

	function applyFilter(val: any, key: string | number) {
		if (val === 'true') return true;
		if (val === 'false') return false;
		if (val === 'null' || val === 'NULL') return null;

		if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
			if (typeof val === 'string' && val.includes(',')) return deepMap(val.split(','), applyFilter);
			else return deepMap(toArray(val), applyFilter);
		}

		if (isDynamicVariable(val)) {
			if (val.startsWith('$NOW')) {
				if (val.includes('(') && val.includes(')')) {
					const adjustment = val.match(REGEX_BETWEEN_PARENS)?.[1];
					if (!adjustment) return new Date();
					return adjustDate(new Date(), adjustment);
				}

				return new Date();
			}

			if (val.startsWith('$CURRENT_USER')) {
				if (val === '$CURRENT_USER') return accountability?.user ?? null;
				return get(context, val, null);
			}

			if (val.startsWith('$CURRENT_ROLE')) {
				if (val === '$CURRENT_ROLE') return accountability?.role ?? null;
				return get(context, val, null);
			}
		}

		return val;
	}
}

function get(obj: Record<string, any> | any[], path: string, defaultValue: any) {
	const pathParts = path.split('.');
	let val = obj;

	while (pathParts.length) {
		const key = pathParts.shift();

		if (key) {
			val = processLevel(val, key);
		}
	}

	return val || defaultValue;

	function processLevel(value: Record<string, any> | any[], key: string) {
		if (Array.isArray(value)) {
			return value.map((subVal) => subVal[key]);
		} else if (value && typeof value === 'object') {
			return value[key];
		}
	}
}
