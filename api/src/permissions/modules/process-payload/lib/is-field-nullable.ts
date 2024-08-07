import type { FieldOverview } from '@directus/types';
import { GENERATE_SPECIAL } from '../../../../constants.js';

/**
 * Checks if a given field is allowed to be set to `null`.
 */
export function isFieldNullable(field: FieldOverview) {
	if (field.nullable) return true;
	if (field.generated) return true;

	const hasGenerateSpecial = GENERATE_SPECIAL.some((name) => field.special.includes(name));

	return hasGenerateSpecial;
}
