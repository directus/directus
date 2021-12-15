import { REGEX_BETWEEN_PARENS } from '../constants';
import { Accountability, Filter, User, Role } from '../types';
import { toArray } from './to-array';
import { adjustDate } from './adjust-date';
import { isDynamicVariable } from './is-dynamic-variable';
import { isObjectLike } from 'lodash';

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

function parseFilterEntry(
	[key, value]: [string, any],
	accountability: Accountability | null,
	context: ParseFilterContext
): Filter {
	if (['_or', '_and'].includes(String(key))) {
		return { [key]: value.map((filter: Filter) => parseFilter(filter, accountability, context)) };
	} else if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
		return { [key]: toArray(value).flatMap((value) => parseFilterValue(value, accountability, context)) } as Filter;
	} else if (String(key).startsWith('_')) {
		return { [key]: parseFilterValue(value, accountability, context) };
	} else {
		return { [key]: parseFilter(value, accountability, context) } as Filter;
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

function get(object: Record<string, any> | any[], path: string, defaultValue: any): any {
	const [key, ...follow] = path.split('.');
	const result = Array.isArray(object) ? object.map((entry) => entry[key!]) : object?.[key!];
	if (follow.length > 0) {
		return get(result, follow.join('.'), defaultValue);
	}
	return result ?? defaultValue;
}
