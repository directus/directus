import { MIN_STRING_LENGTH_FOR_WORD_DIFF } from '@/constants/comparison-diff';

export function shouldShowComparisonDiff(
	comparisonMode: boolean | undefined,
	comparisonSide: 'base' | 'incoming' | undefined,
	comparisonBaseValue: any,
	comparisonIncomingValue: any,
): boolean {
	if (!comparisonMode || !comparisonSide) return false;
	if (comparisonBaseValue === undefined && comparisonIncomingValue === undefined) return false;

	const baseValue = comparisonBaseValue ?? null;
	const incomingValue = comparisonIncomingValue ?? null;

	if (
		typeof baseValue === 'string' &&
		typeof incomingValue === 'string' &&
		incomingValue.length > MIN_STRING_LENGTH_FOR_WORD_DIFF
	) {
		return true;
	}

	if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
		return true;
	}

	if (
		baseValue &&
		incomingValue &&
		typeof baseValue === 'object' &&
		typeof incomingValue === 'object' &&
		!Array.isArray(baseValue) &&
		!Array.isArray(incomingValue)
	) {
		return true;
	}

	return false;
}
