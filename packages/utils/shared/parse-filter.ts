import { adjustDate } from './adjust-date.js';
import { deepMap } from './deep-map.js';
import { get } from './get-with-arrays.js';
import { isObject } from './is-object.js';
import { parseJSON } from './parse-json.js';
import { toArray } from './to-array.js';
import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, Filter, Policy, Role, User } from '@directus/types';
import { isObjectLike } from 'lodash-es';

type ParseFilterContext = {
	// The user can add any custom fields to any of them
	$CURRENT_USER?: User & Record<string, any>;
	$CURRENT_ROLE?: Role & Record<string, any>;
	$CURRENT_ROLES?: (Role & Record<string, any>)[];
	$CURRENT_POLICIES?: (Policy & Record<string, any>)[];
};

type BasicAccountability = Pick<Accountability, 'user' | 'role' | 'roles'>;

export function parseFilter(
	filter: Filter | null,
	accountability: BasicAccountability | null,
	context: ParseFilterContext = {},
	skipCoercion = false,
): Filter | null {
	let parsedFilter = parseFilterRecursive(filter, accountability, context);

	if (!parsedFilter) {
		return parsedFilter;
	}

	if (skipCoercion === false) {
		parsedFilter = deepMap(parsedFilter, (value) => {
			if (value === 'true') return true;
			if (value === 'false') return false;
			if (value === 'null' || value === 'NULL') return null;

			return value;
		});
	}

	return shiftLogicalOperatorsUp(parsedFilter);
}

const logicalFilterOperators = ['_and', '_or'];
const bypassOperators = ['_none', '_some'];

function shiftLogicalOperatorsUp(filter: any): any {
	const key = Object.keys(filter)[0];
	if (!key) return filter;

	if (logicalFilterOperators.includes(key)) {
		return {
			[key]: filter[key].map(shiftLogicalOperatorsUp),
		};
	} else if (key.startsWith('_')) {
		return filter;
	} else {
		const childResult = shiftLogicalOperatorsUp(filter[key]);
		const childKey = Object.keys(childResult)[0];

		if (!childKey) return { [key]: childResult };

		if (logicalFilterOperators.includes(childKey)) {
			return shiftLogicalOperatorsUp({
				[childKey]: childResult[childKey].map((nestedFilter: any) => ({
					[key]: nestedFilter,
				})),
			});
		}

		return { [key]: childResult };
	}
}

function parseFilterRecursive(
	filter: Filter | null,
	accountability: BasicAccountability | null,
	context: ParseFilterContext = {},
): Filter | null {
	if (filter === null || filter === undefined) {
		return null;
	}

	if (!isObjectLike(filter)) {
		return { _eq: parseDynamicVariable(filter, accountability, context) };
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
	accountability: BasicAccountability | null,
	context: ParseFilterContext,
) {
	if (!preset) return preset;
	return deepMap(preset, (value) => {
		if (value === 'true') return true;
		if (value === 'false') return false;
		if (value === 'null' || value === 'NULL') return null;

		return parseDynamicVariable(value, accountability, context);
	});
}

function parseFilterEntry(
	[key, value]: [string, any],
	accountability: BasicAccountability | null,
	context: ParseFilterContext,
): Filter {
	if (['_or', '_and'].includes(String(key))) {
		return { [key]: value.map((filter: Filter) => parseFilterRecursive(filter, accountability, context)) };
	} else if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
		// When array indices are above 20 (default value),
		// the query parser (qs) parses them as a key-value pair object instead of an array,
		// so we will need to convert them back to an array
		const val = isObject(value) ? Object.values(value) : value;
		return { [key]: toArray(val).flatMap((value) => parseDynamicVariable(value, accountability, context)) } as Filter;
	} else if (['_intersects', '_nintersects', '_intersects_bbox', '_nintersects_bbox'].includes(String(key))) {
		// Geometry filters always expect to operate against a GeoJSON object. Parse the
		// value to JSON in case a stringified JSON blob is passed
		return {
			[key]: parseDynamicVariable(typeof value === 'string' ? parseJSON(value) : value, accountability, context),
		};
	} else if (String(key).startsWith('_') && !bypassOperators.includes(key)) {
		return { [key]: parseDynamicVariable(value, accountability, context) };
	} else {
		return { [key]: parseFilterRecursive(value, accountability, context) } as Filter;
	}
}

function parseDynamicVariable(value: any, accountability: BasicAccountability | null, context: ParseFilterContext) {
	if (typeof value !== 'string') {
		return value;
	}

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

	if (value.startsWith('$CURRENT_ROLES')) {
		if (value === '$CURRENT_ROLES') return accountability?.roles ?? null;
		return get(context, value, null);
	}

	if (value.startsWith('$CURRENT_ROLE')) {
		if (value === '$CURRENT_ROLE') return accountability?.role ?? null;
		return get(context, value, null);
	}

	if (value.startsWith('$CURRENT_POLICIES')) {
		if (value === '$CURRENT_POLICIES')
			return (get(context, value, null) as Policy[] | null)?.map(({ id }) => id) ?? null;
		return get(context, value, null);
	}

	return value;
}
