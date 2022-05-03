import { REGEX_BETWEEN_PARENS } from '@directus/shared/constants';
import { FieldFunction } from '@directus/shared/types';

export function extractFieldFromFunction(fieldKey: string): { fn: FieldFunction | null; field: string } {
	let functionName;

	if (fieldKey.includes('(') && fieldKey.includes(')')) {
		functionName = fieldKey.split('(')[0] as FieldFunction | undefined;
		fieldKey = fieldKey.match(REGEX_BETWEEN_PARENS)![1];
	}

	return { fn: functionName ?? null, field: fieldKey };
}
