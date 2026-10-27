import { NUMERIC_TYPES } from '@directus/constants';
import type { Field, Filter, NumericValue } from '@directus/types';
import { isIn, isValidUuid, type NumberInfo, numberInRange, parseNumericString } from '@directus/utils';
import { set } from 'lodash-es';
import { useFieldsStore } from '@/stores/fields';

/**
 * Search the given field paths, including relational ones the API's `search` parameter can't reach
 */
export function getSearchFilter(collection: string, fields: readonly string[], search: string): Filter | null {
	const fieldsStore = useFieldsStore();

	const conditions = fields.flatMap((fieldKey) => {
		const field = fieldsStore.getField(collection, fieldKey);

		if (!field || field.meta?.searchable === false || field.meta?.special?.includes('conceal')) {
			return [];
		}

		const operator = getOperator(field, search);

		if (!operator) {
			return [];
		}

		return [set({}, fieldKey, operator) as Filter];
	});

	if (conditions.length === 0) {
		return null;
	}

	return { _or: conditions };
}

function getOperator(field: Field, search: string): Record<string, string | number> | null {
	if (field.type === 'string' || field.type === 'text') {
		return { _icontains: search };
	}

	if (isIn(field.type, NUMERIC_TYPES)) {
		const number = parseNumericString(search);

		const info: NumberInfo = {
			type: field.type,
			precision: field.schema?.numeric_precision ?? null,
			scale: field.schema?.numeric_scale ?? null,
		};

		if (number === null || !isNumberValid(number, info)) {
			return null;
		}

		// BigInts can't be serialized to JSON, the API accepts them as strings
		return { _eq: typeof number === 'bigint' ? String(number) : number };
	}

	if (field.type === 'uuid' && isValidUuid(search)) {
		return { _eq: search };
	}

	return null;
}

/**
 * The app can't know the database vendor, so apply the strictest of the API's per-vendor checks
 */
function isNumberValid(number: NumericValue, info: NumberInfo): boolean {
	if (!numberInRange(number, info)) {
		return false;
	}

	if (typeof number !== 'bigint' && (info.type === 'integer' || info.type === 'bigInteger')) {
		return number % 1 === 0;
	}

	return true;
}
