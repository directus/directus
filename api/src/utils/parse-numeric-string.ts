import type { NumericValue } from '@directus/types';

export function parseNumericString(stringValue: string): NumericValue | null {
	let number: NumericValue = Number(stringValue);

	if (isNaN(number) || !Number.isFinite(number)) {
		return null; // invalid numbers
	}

	if (number > Number.MAX_SAFE_INTEGER || number < Number.MIN_SAFE_INTEGER) {
		try {
			number = BigInt(stringValue);
		} catch {
			// BigInt parsing failed, e.g. it was a float larger than MAX_SAFE_INTEGER
			return null;
		}
	}

	// casting parsed value back to string should be equal the original value
	// (prevent unintended number parsing, e.g. String(7) !== "ob111")
	if (String(number) !== stringValue) {
		return null;
	}

	return number;
}
