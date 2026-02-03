import { isArray, isNil, isPlainObject, isString } from 'lodash';

export function shouldShowComparisonDiff(
	comparisonMode: boolean | undefined,
	comparisonSide: 'base' | 'incoming' | undefined,
	comparisonBaseValue: any,
	comparisonIncomingValue: any,
): boolean {
	if (!comparisonMode || !comparisonSide) return false;
	if (isNil(comparisonBaseValue) && isNil(comparisonIncomingValue)) return false;

	if (comparisonBaseValue === comparisonIncomingValue) return false;

	const isStringOrNil = (val: any) => isString(val) || isNil(val);
	if (isStringOrNil(comparisonBaseValue) && isStringOrNil(comparisonIncomingValue)) return true;

	const isArrayOrNil = (val: any) => isArray(val) || isNil(val);
	if (isArrayOrNil(comparisonBaseValue) && isArrayOrNil(comparisonIncomingValue)) return true;

	const isObjectOrNil = (val: any) => isPlainObject(val) || isNil(val);
	if (isObjectOrNil(comparisonBaseValue) && isObjectOrNil(comparisonIncomingValue)) return true;

	return false;
}
