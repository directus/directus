import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, Filter, Policy, Role, User } from '@directus/types';
import { isObjectLike } from 'lodash-es';
import { adjustDate } from './adjust-date.js';
import { deepMap } from './deep-map.js';
import { get } from './get-with-arrays.js';
import { isObject } from './is-object.js';
import { parseJSON } from './parse-json.js';
import { toArray } from './to-array.js';

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

	const entries = Object.entries(filter);

	// If the filter has _and or _or as the only key, preserve the structure
	// But first, convert object-form arrays to actual arrays (from query params)
	if (entries.length === 1 && ['_and', '_or'].includes(entries[0]![0]!)) {
		const [key, value] = entries[0]!;

		// Convert object-form arrays to arrays before processing
		if (isObject(value) && !Array.isArray(value)) {
			const convertedValue = Object.values(value);
			return parseFilterEntry([key, convertedValue], accountability, context);
		}

		return parseFilterEntry(entries[0]!, accountability, context);
	}

	const filters = entries.map((entry) => parseFilterEntry(entry, accountability, context));

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
		// When array indices are above 20 (default value),
		// the query parser (qs) parses them as a key-value pair object instead of an array,
		// so we will need to convert them back to an array
		const val = isObject(value) && !Array.isArray(value) ? Object.values(value) : value;
		return {
			[key]: toArray(val).map((filter: Filter) => parseFilterRecursive(filter, accountability, context)),
		} as Filter;
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
	} else if (bypassOperators.includes(key)) {
		// _none and _some expect a flat Filter object with multiple fields, not wrapped in _and
		// Parse each field recursively but merge them into a flat object
		if (isObjectLike(value)) {
			const parsedFields: Record<string, any> = {};

			for (const [fieldKey, fieldValue] of Object.entries(value)) {
				const parsedField = parseFilterRecursive({ [fieldKey]: fieldValue } as Filter, accountability, context);

				if (parsedField && typeof parsedField === 'object') {
					Object.assign(parsedFields, parsedField);
				}
			}

			return { [key]: parsedFields } as Filter;
		}

		return { [key]: parseDynamicVariable(value, accountability, context) };
	} else if (String(key).startsWith('_')) {
		// If the value is an object with a single key that matches the operator key,
		// it might be a nested operator structure from query params (e.g., { _eq: { _eq: '4' } })
		// In this case, unwrap it to just the operator with the inner value
		if (isObjectLike(value) && !Array.isArray(value)) {
			const valueEntries = Object.entries(value);

			if (valueEntries.length === 1) {
				const [innerKey, innerValue] = valueEntries[0]!;

				// If the inner key matches the outer key (operator), unwrap it
				if (innerKey === key && String(key).startsWith('_')) {
					return { [key]: parseDynamicVariable(innerValue, accountability, context) };
				}
			}
		}

		return { [key]: parseDynamicVariable(value, accountability, context) };
	} else {
		// For regular field keys, recursively parse the value
		// But first check if the value has bracket-wrapped operator keys (e.g., "[_eq]" from qs parsing)
		// and unwrap them, and also check for nested operator structures
		if (isObjectLike(value) && !Array.isArray(value)) {
			const valueEntries = Object.entries(value);
			
			// Check if any keys are bracket-wrapped operators (e.g., "[_eq]" should become "_eq")
			// This happens when qs parses nested array structures like filter[_and][0][field][_eq]=value
			const cleanedValue: Record<string, any> = {};
			let hasBracketKeys = false;

			for (const [innerKey, innerValue] of valueEntries) {
				// Unwrap bracket-wrapped keys: "[_eq]" -> "_eq"
				let cleanedKey = innerKey;

				if (cleanedKey.startsWith('[') && cleanedKey.endsWith(']')) {
					cleanedKey = cleanedKey.slice(1, -1);
					hasBracketKeys = true;
				}

				cleanedValue[cleanedKey] = innerValue;
			}
			
			// If we cleaned any keys, use the cleaned value
			if (hasBracketKeys) {
				value = cleanedValue;
			}
			
			// Check for nested operator structures (e.g., { _eq: { _eq: '4' } })
			const cleanedEntries = Object.entries(value);

			if (cleanedEntries.length === 1) {
				const [innerKey, innerValue] = cleanedEntries[0]!;

				// If the inner key is an operator (starts with _) and the inner value is also an object with the same operator key,
				// unwrap one level (this handles query param structures like field[_eq][_eq]=value)
				if (String(innerKey).startsWith('_') && isObjectLike(innerValue) && !Array.isArray(innerValue)) {
					const innerValueEntries = Object.entries(innerValue as Record<string, unknown>);

					if (innerValueEntries.length === 1 && innerValueEntries[0]![0] === innerKey) {
						// Unwrap: { _eq: { _eq: '4' } } -> { _eq: '4' }
						return { [key]: { [innerKey]: innerValueEntries[0]![1] } } as Filter;
					}
				}
			}
		}

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
