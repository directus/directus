import { isObjectLike } from 'lodash';
import { REGEX_BETWEEN_PARENS } from '../constants';
import { Accountability, Filter, Role, User } from '../types';
import { adjustDate } from './adjust-date';
import { deepMap } from './deep-map';
import { get } from './get-with-arrays';
import { isDynamicVariable } from './is-dynamic-variable';
import { toArray } from './to-array';

type ParseFilterContext = {
	// The user can add any custom fields to user
	$CURRENT_USER?: User & Record<string, any>;
	$CURRENT_ROLE?: Role & Record<string, any>;
};

export function parseFilter(
	filter: Filter | null,
	accountability: Accountability | null,
	context: ParseFilterContext = {}
): Filter | null {
	let parsedFilter = parseFilterRecursive(filter, accountability, context);
	if (parsedFilter) {
		parsedFilter = shiftLogicalOperatorsUp(parsedFilter);
	}
	return parsedFilter;
}

const logicalFilterOperators = ['_and', '_or'];
const bypassOperators = ['_none', '_some'];

function shiftLogicalOperatorsUp(filter: any): any {
	const key = Object.keys(filter)[0];
	if (!key) return filter;

	if (logicalFilterOperators.includes(key)) {
		for (const childKey of Object.keys(filter[key])) {
			filter[key][childKey] = shiftLogicalOperatorsUp(filter[key][childKey]);
		}
		return filter;
	} else {
		const childKey = Object.keys(filter[key])[0];
		if (!childKey) return filter;
		if (logicalFilterOperators.includes(childKey)) {
			return {
				[childKey]: toArray(filter[key][childKey]).map((childFilter) => {
					return { [key]: shiftLogicalOperatorsUp(childFilter) };
				}),
			};
		} else if (bypassOperators.includes(childKey)) {
			return { [key]: { [childKey]: shiftLogicalOperatorsUp(filter[key][childKey]) } };
		} else if (childKey.startsWith('_')) {
			return filter;
		} else {
			return { [key]: shiftLogicalOperatorsUp(filter[key]) };
		}
	}
}

function parseFilterRecursive(
	filter: Filter | null,
	accountability: Accountability | null,
	context: ParseFilterContext = {}
): Filter | null {
	if (filter === null || filter === undefined) {
		return null;
	}

	if (!isObjectLike(filter)) {
		return { _eq: parseFilterValue(filter, accountability, context) };
	}

	const filters = Object.entries(filter).map((entry) => parseFilterEntry(entry, accountability, context));

	if (filters.length === 0) {
		return {};
	} else if (filters.length === 1) {
		return filters[0] ?? null;
	} else {
		return { _and: filters };
	}
}

export function parsePreset(
	preset: Record<string, any> | null,
	accountability: Accountability | null,
	context: ParseFilterContext
) {
	if (!preset) return preset;
	return deepMap(preset, (value) => parseFilterValue(value, accountability, context));
}

function parseFilterEntry(
	[key, value]: [string, any],
	accountability: Accountability | null,
	context: ParseFilterContext
): Filter {
	if (['_or', '_and'].includes(String(key))) {
		return { [key]: value.map((filter: Filter) => parseFilterRecursive(filter, accountability, context)) };
	} else if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
		return { [key]: toArray(value).flatMap((value) => parseFilterValue(value, accountability, context)) } as Filter;
	} else if (String(key).startsWith('_') && !bypassOperators.includes(key)) {
		return { [key]: parseFilterValue(value, accountability, context) };
	} else if (String(key).startsWith('item__') && isObjectLike(value)) {
		return { [`item:${String(key).split('item__')[1]}`]: parseFilter(value, accountability, context) } as Filter;
	} else {
		return { [key]: parseFilterRecursive(value, accountability, context) } as Filter;
	}
}

function parseFilterValue(value: any, accountability: Accountability | null, context: ParseFilterContext) {
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (value === 'null' || value === 'NULL') return null;
	if (isDynamicVariable(value)) return parseDynamicVariable(value, accountability, context);
	return value;
}

function parseDynamicVariable(value: any, accountability: Accountability | null, context: ParseFilterContext) {
	if (value.startsWith('$NOW')) {
		if (value.includes('(') && value.includes(')')) {
			const adjustment = value.match(REGEX_BETWEEN_PARENS)?.[1];
			if (!adjustment) return new Date();
			return adjustDate(new Date(), adjustment);
		}

		return new Date();
	}

	if (value.startsWith('$CURRENT_USER')) {
		if (value === '$CURRENT_USER') return accountability?.user ?? null;
		return get(context, value, null);
	}

	if (value.startsWith('$CURRENT_ROLE')) {
		if (value === '$CURRENT_ROLE') return accountability?.role ?? null;
		return get(context, value, null);
	}
}
